// /api/chat.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = { maxDuration: 30 };

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// ─────────────────────────────────────────────────────────────────────────────
// Final design:
//
//   qwen/qwen3.6-27b → THE model for every message, always, for both
//                      admin-key and user's-own-key paths (same path,
//                      everywhere). Strong at math/code/reasoning.
//
//   thinkingMode      → explicit flag from the client (a UI toggle the user
//                      presses), default false. NOT auto-detected from
//                      content — deterministic and free when off.
//                        false → reasoning_effort "none"  (fast, cheap)
//                        true  → reasoning_effort "default" (real thinking)
//
//   web search         → a custom `web_search` function tool, always
//                      attached. Qwen decides for itself whether to call
//                      it. Groq's hosting of this model sometimes returns
//                      the tool-call request as literal text instead of a
//                      structured field (a known quirk of this specific
//                      model/host combination) — so this file detects BOTH
//                      the structured form AND the raw-text forms, and
//                      defensively strips any leftover tool-call markup
//                      from whatever is shown to the user, so nothing raw
//                      ever reaches the screen.
// ─────────────────────────────────────────────────────────────────────────────

const QWEN_MODEL     = "qwen/qwen3.6-27b";
const COMPOUND_MODEL = "groq/compound";

const ELIYEN_SYSTEM_PROMPT = `
You are Eliyen, an AI assistant built by PROHOR AI.

You always know your own capabilities — you never have to guess, hedge, or say
"I can't do that" just because you personally don't perform a step directly,
if the app around you supports it. Inside this app you can:
- Hold normal conversations, help with writing, coding, math, study, translation, and social media content.
- Search the web yourself when a question needs live, current, or recent information, by calling your web_search tool through the normal tool-call mechanism — never by writing the tool call out as visible text.
- Read and analyze photos and PDF documents the user sends you.
- Create images when asked to generate, draw, or design something.
- Transcribe voice input.

How you answer:
- Keep answers direct and to the point. Don't pad simple questions with unnecessary explanation.
- If a question depends on current/live/recent facts (news, prices, scores, weather, "today", anything that could have changed recently or is after your training), call the web_search tool to check first rather than guessing from memory.
- After a tool result comes back, always write your final answer yourself in plain natural language — never show raw JSON, XML, tool syntax, or code blocks of tool output to the user.
- Write math in plain, ordinary notation people can read normally: x^2, 1/x, sqrt(x), (a+b), >=, <=. Never output raw LaTeX commands like \\frac, \\sqrt{}, \\ge, or \\[ ... \\].
- Never mention internal model names, backend routing, or tool implementation details unless the user explicitly asks how the app works technically.
- Be warm, direct, and genuinely helpful — like a sharp, knowledgeable friend, not a corporate script.
`.trim();

const WEB_SEARCH_TOOL = {
  type: "function",
  function: {
    name: "web_search",
    description:
      "Search the live web for current, recent, or real-time information — news, prices, scores, dates, facts that may have changed recently, or anything your own knowledge might be outdated on. Only call this when the question genuinely needs it.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "A short, specific search query capturing what needs to be looked up.",
        },
      },
      required: ["query"],
    },
  },
};

// ── Robust tool-call detection ──────────────────────────────────────────────
// Handles the standard structured field AND the raw-text formats this
// specific model/host combination is known to sometimes emit instead.
type ParsedCall = { query: string } | null;

function parseToolCallFromText(text: string): ParsedCall {
  if (!text || (!text.includes("<tool_call") && !text.includes("<function="))) return null;

  // Variant A: <tool_call>{"name":"web_search","arguments":{"query":"..."}}</tool_call>
  const wrapped = text.match(/<tool_call>([\s\S]*?)<\/tool_call>/i);
  const innerText = wrapped ? wrapped[1].trim() : text;

  try {
    const obj = JSON.parse(innerText);
    let args = obj?.arguments ?? obj?.parameters ?? obj;
    if (typeof args === "string") { try { args = JSON.parse(args); } catch {} }
    const query = args?.query || args?.q || "";
    if (query) return { query: String(query) };
  } catch {
    // not JSON — try the XML function/parameter variant below
  }

  // Variant B: <function=web_search><parameter=query>...</parameter></function>
  const paramMatch =
    innerText.match(/<parameter=query>([\s\S]*?)<\/parameter>/i) ||
    text.match(/<parameter=query>([\s\S]*?)<\/parameter>/i) ||
    innerText.match(/<parameter=q>([\s\S]*?)<\/parameter>/i) ||
    text.match(/<parameter=q>([\s\S]*?)<\/parameter>/i);

  if (paramMatch) return { query: paramMatch[1].trim() };

  // Detected intent (a function/tool_call tag exists) but couldn't extract a
  // clean query — the caller falls back to searching using the user's own
  // last message text instead of failing outright.
  return { query: "" };
}

function stripToolCallArtifacts(text: string): string {
  return text
    .replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, "")
    .replace(/<function=[\s\S]*?<\/function>/gi, "")
    .replace(/<function=[a-zA-Z0-9_]+>/gi, "")
    .replace(/<parameter=[\s\S]*?<\/parameter>/gi, "")
    .trim();
}

async function executeWebSearch(query: string, apiKey: string): Promise<string> {
  try {
    const r = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: COMPOUND_MODEL,
        messages: [{ role: "user", content: query }],
        temperature: 0.3,
      }),
    });
    const data = await r.json().catch(() => null);
    const text = data?.choices?.[0]?.message?.content;
    if (typeof text === "string" && text.trim()) return text.trim();
    return `No results found for: ${query}`;
  } catch (e: any) {
    return `Web search request failed (${e?.message || "network error"}) for: ${query}`;
  }
}

function sendDelta(res: VercelResponse, delta: Record<string, any>) {
  res.write(`data: ${JSON.stringify({ choices: [{ delta, finish_reason: null }] })}\n\n`);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body ?? {});
    const {
      modelId, messages, userKey, userApiKey, prompt, systemInstruction, mode,
      audioBase64, imageBase64, mimeType, language, stream, thinkingMode,
    } = body as {
      modelId?: string; messages?: any[]; userKey?: string; userApiKey?: string;
      prompt?: string; systemInstruction?: string;
      mode?: "chat" | "image" | "transcribe" | "vision";
      audioBase64?: string; imageBase64?: string; mimeType?: string;
      language?: string; stream?: boolean;
      thinkingMode?: boolean; // explicit UI toggle — off by default, wired later
    };

    if (mode === "chat" && !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages are required" });
    }

    const keyFromClient = (userKey ?? userApiKey ?? "").trim();
    const hasUserKey = keyFromClient.length > 0;

    // ═══════════════════════════════════════════════════════════════════════
    // IMAGE GENERATION MODE — unchanged
    // ═══════════════════════════════════════════════════════════════════════
    if (mode === "image") {
      const imagePrompt = (prompt || "").trim();
      if (hasUserKey) return res.status(403).json({ error: "Image generation is available only in admin mode" });
      if (!imagePrompt) return res.status(400).json({ error: "prompt is required" });

      const geminiApiKey = process.env.GEMINI_API_KEY || "";
      if (!geminiApiKey) return res.status(400).json({ error: "Missing API key (GEMINI_API_KEY)" });

      const actualImageModel =
        modelId === "imagen-4-fast-generate" ? "imagen-4.0-fast-generate-001"
        : modelId === "imagen-4-ultra-generate" ? "imagen-4.0-ultra-generate-001"
        : "imagen-4.0-generate-001";

      const imageRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${actualImageModel}:predict`,
        {
          method: "POST",
          headers: { "x-goog-api-key": geminiApiKey, "Content-Type": "application/json" },
          body: JSON.stringify({ instances: [{ prompt: imagePrompt }], parameters: { sampleCount: 1 } }),
        }
      );
      const imageData = await imageRes.json().catch(() => null);
      if (!imageRes.ok) {
        return res.status(imageRes.status).json({
          error: imageData?.error?.message || imageData?.error || "Image generation failed",
        });
      }
      const imageBytes =
        imageData?.predictions?.[0]?.bytesBase64Encoded ||
        imageData?.predictions?.[0]?.image?.bytesBase64Encoded ||
        imageData?.generatedImages?.[0]?.image?.imageBytes || "";
      if (!imageBytes) return res.status(502).json({ error: "No image bytes returned from Gemini" });

      return res.status(200).json({ imageUrl: `data:image/png;base64,${imageBytes}`, modelId: actualImageModel });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // VISION MODE — Qwen 3.6 27B, no tool-calling involved
    // ═══════════════════════════════════════════════════════════════════════
    if (mode === "vision") {
      if (hasUserKey) return res.status(403).json({ error: "Image analysis is available only in admin mode" });

      const groqApiKey = process.env.GROQ_API_KEY || "";
      if (!groqApiKey) return res.status(400).json({ error: "Missing API key (GROQ_API_KEY)" });

      const cleanImageBase64 = (imageBase64 || "").replace(/^data:.*;base64,/, "").trim();
      if (!cleanImageBase64) return res.status(400).json({ error: "imageBase64 is required" });

      const actualMimeType = (mimeType || "image/jpeg").trim() || "image/jpeg";
      const imageUrl = `data:${actualMimeType};base64,${cleanImageBase64}`;
      const visionPrompt = (prompt || "").trim() ||
        "Read the image carefully and return only the main text, question, or useful visible content from the image. Do not solve it unless the image itself asks for a direct answer.";

      const visionRes = await fetch(GROQ_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${groqApiKey}` },
        body: JSON.stringify({
          model: QWEN_MODEL,
          temperature: 0.1,
          reasoning_effort: "none",
          reasoning_format: "hidden",
          messages: [
            { role: "system", content: "You only analyze the image and extract the useful visible text, question, or content. Keep it clean and concise. Do not add extra explanation unless necessary." },
            { role: "user", content: [
              { type: "text", text: visionPrompt },
              { type: "image_url", image_url: { url: imageUrl } },
            ]},
          ],
        }),
      });

      const visionRaw = await visionRes.text();
      let visionData: any = null;
      try { visionData = visionRaw ? JSON.parse(visionRaw) : null; } catch { visionData = null; }

      if (!visionRes.ok) {
        return res.status(visionRes.status).json({
          error: visionData?.error?.message || visionData?.error || visionRaw.slice(0, 300) || "Image analysis failed",
        });
      }

      const visionMsg = visionData?.choices?.[0]?.message;
      const visionContent = visionMsg?.content;
      let extracted = "";
      if (typeof visionContent === "string") extracted = visionContent;
      else if (Array.isArray(visionContent)) {
        extracted = visionContent.map((p: any) =>
          typeof p === "string" ? p : typeof p?.text === "string" ? p.text : typeof p?.content === "string" ? p.content : ""
        ).join("");
      }
      extracted = stripToolCallArtifacts(extracted.trim());

      return res.status(200).json({ text: extracted, modelId: QWEN_MODEL });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TRANSCRIBE MODE — unchanged
    // ═══════════════════════════════════════════════════════════════════════
    if (mode === "transcribe") {
      if (hasUserKey) return res.status(403).json({ error: "Voice transcription is available only in admin mode" });

      const groqApiKey = process.env.GROQ_API_KEY || "";
      if (!groqApiKey) return res.status(400).json({ error: "Missing API key (GROQ_API_KEY)" });

      const cleanBase64 = (audioBase64 || "").replace(/^data:.*;base64,/, "").trim();
      if (!cleanBase64) return res.status(400).json({ error: "audioBase64 is required" });

      const actualMimeType = (mimeType || "audio/webm").trim() || "audio/webm";
      const audioBuffer = Buffer.from(cleanBase64, "base64");
      const audioBlob = new Blob([audioBuffer], { type: actualMimeType });
      const ext = actualMimeType.includes("wav") ? "wav"
        : actualMimeType.includes("ogg") ? "ogg"
        : actualMimeType.includes("mp4") ? "mp4"
        : actualMimeType.includes("mpeg") || actualMimeType.includes("mp3") ? "mp3" : "webm";

      const formData = new FormData();
      formData.append("model", "whisper-large-v3-turbo");
      formData.append("file", audioBlob, `voice.${ext}`);
      formData.append("response_format", "json");
      if (language && language.trim()) formData.append("language", language.trim());

      const sttRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST", headers: { Authorization: `Bearer ${groqApiKey}` }, body: formData,
      });
      const sttRaw = await sttRes.text();
      let sttData: any = null;
      try { sttData = sttRaw ? JSON.parse(sttRaw) : null; } catch { sttData = { text: sttRaw }; }
      if (!sttRes.ok) return res.status(sttRes.status).json({ error: sttData?.error?.message || sttData?.error || "Transcription failed" });

      const text = typeof sttData?.text === "string" ? sttData.text.trim() : "";
      return res.status(200).json({ text, modelId: "whisper-large-v3-turbo" });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CHAT MODE — Qwen 3.6 27B, always, with robust tool-call handling
    // ═══════════════════════════════════════════════════════════════════════

    const apiKey = hasUserKey ? keyFromClient : (process.env.GROQ_API_KEY || "");
    if (!apiKey) {
      return res.status(400).json({ error: hasUserKey ? "Missing API key (userKey)" : "Missing API key (GROQ_API_KEY)" });
    }

    const finalModelId = modelId && modelId !== "auto" ? modelId : QWEN_MODEL;
    const isQwen = finalModelId === QWEN_MODEL;

    const customSystem = typeof systemInstruction === "string" && systemInstruction.trim()
      ? { role: "system", content: systemInstruction.trim() } : null;
    const identitySystem = { role: "system", content: ELIYEN_SYSTEM_PROMPT };
    const finalMessages = [identitySystem, ...(customSystem ? [customSystem] : []), ...messages];

    // Deterministic, UI-controlled — never guessed from message content.
    const wantsThinking = thinkingMode === true;
    const effort = wantsThinking ? "default" : "none";

    const decisionRequest: Record<string, any> = {
      model: finalModelId,
      messages: finalMessages,
      temperature: 0.7,
      stream: false, // decision call is never streamed — needed for reliable parsing
    };

    if (isQwen) {
      decisionRequest.max_completion_tokens = wantsThinking ? 4096 : 1536;
      decisionRequest.reasoning_effort = effort;
      decisionRequest.reasoning_format = wantsThinking ? "parsed" : "hidden";
      decisionRequest.tools = [WEB_SEARCH_TOOL];
      decisionRequest.tool_choice = "auto";
    } else {
      decisionRequest.max_tokens = 2048;
    }

    const decisionRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(decisionRequest),
    });
    const decisionText = await decisionRes.text();
    let decisionData: any = null;
    try { decisionData = decisionText ? JSON.parse(decisionText) : null; } catch { decisionData = null; }

    if (!decisionRes.ok) {
      const realMsg = decisionData?.error?.message || decisionData?.error || decisionText.slice(0, 300) || `Upstream error (HTTP ${decisionRes.status})`;
      if (mode === "chat" && stream) {
        res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        sendDelta(res, { content: `⚠️ ${realMsg}` });
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }
      return res.status(decisionRes.status || 502).json({ error: realMsg });
    }
    if (!decisionData) {
      const realMsg = decisionText.slice(0, 300) || "Invalid response from provider";
      if (mode === "chat" && stream) {
        res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        sendDelta(res, { content: `⚠️ ${realMsg}` });
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }
      return res.status(502).json({ error: realMsg });
    }

    const decisionMsg = decisionData?.choices?.[0]?.message;
    let decisionContent = decisionMsg?.content;
    if (Array.isArray(decisionContent)) {
      decisionContent = decisionContent.map((p: any) => typeof p === "string" ? p : p?.text || p?.content || "").join("");
    }
    decisionContent = typeof decisionContent === "string" ? decisionContent : "";
    const decisionReasoning = typeof decisionMsg?.reasoning === "string" ? decisionMsg.reasoning : "";

    // ── Detect a tool-call intent — structured field OR raw-text leak ────────
    const structuredCalls = Array.isArray(decisionMsg?.tool_calls) ? decisionMsg.tool_calls : [];
    let searchQuery = "";
    let toolWasRequested = false;

    if (structuredCalls.length > 0) {
      toolWasRequested = true;
      try {
        const parsedArgs = JSON.parse(structuredCalls[0]?.function?.arguments || "{}");
        searchQuery = parsedArgs?.query || "";
      } catch {}
    } else {
      const textParsed = parseToolCallFromText(decisionContent);
      if (textParsed) {
        toolWasRequested = true;
        searchQuery = textParsed.query;
      }
    }

    // If a tool intent was detected but no usable query was extracted,
    // fall back to searching using the user's own last message — reliable
    // and always produces a sensible result instead of failing.
    if (toolWasRequested && !searchQuery.trim()) {
      const lastUser = [...messages].reverse().find((m: any) => m.role === "user");
      searchQuery = (typeof lastUser?.content === "string" ? lastUser.content : "").slice(0, 200) || "latest information";
    }

    // ── Case 1: no tool needed — the decision call IS the final answer ───────
  
      if (!toolWasRequested) {
      const cleanContent = stripToolCallArtifacts(decisionContent).trim() || "⚠️ Empty response from model";

      if (mode === "chat" && stream) {
        res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        if (decisionReasoning.trim()) sendDelta(res, { reasoning: decisionReasoning.trim() });
        const chunkSize = 28;
        for (let i = 0; i < cleanContent.length; i += chunkSize) {
          sendDelta(res, { content: cleanContent.slice(i, i + chunkSize) });
        }
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }
      return res.status(200).json({ text: cleanContent });
    }

    // ── Case 2: tool needed — execute the real search, then let Qwen write
    // the actual final answer (no tools attached this time, so it can't
    // loop into another tool-call attempt). ──────────────────────────────────
    const resultText = await executeWebSearch(searchQuery, apiKey);

    const followUpMessages = [
      ...finalMessages,
      { role: "user", content: `Here is live web search information for: "${searchQuery}"\n\n${resultText}\n\nUsing this, answer the original question naturally in your own words. Do not mention the search or show any raw data.` },
    ];

    const followUpRequest: Record<string, any> = {
      model: QWEN_MODEL,
      messages: followUpMessages,
      temperature: 0.7,
      max_completion_tokens: wantsThinking ? 4096 : 1536,
      reasoning_effort: effort,
      reasoning_format: wantsThinking ? "parsed" : "hidden",
      stream: Boolean(stream && mode === "chat"),
    };

    const followUpRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(followUpRequest),
    });

    if (mode === "chat" && stream) {
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");

      if (!followUpRes.ok || !followUpRes.body) {
        const errText = await followUpRes.text();
        sendDelta(res, { content: `⚠️ Search follow-up failed: ${errText.slice(0, 200) || followUpRes.status}` });
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }
      const reader = followUpRes.body.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(decoder.decode(value, { stream: true }));
        }
      } catch (e: any) {
        sendDelta(res, { content: `\n\n[Connection error: ${e?.message || "stream interrupted"}]` });
      }
      res.end();
      return;
    }

    // Non-streaming follow-up
    const followUpRaw = await followUpRes.text();
    let followUpData: any = null;
    try { followUpData = followUpRaw ? JSON.parse(followUpRaw) : null; } catch { followUpData = null; }

    if (!followUpRes.ok || !followUpData) {
      const realMsg = followUpData?.error?.message || followUpData?.error || followUpRaw.slice(0, 300) || "Search follow-up failed";
      return res.status(followUpRes.status || 502).json({ error: realMsg });
    }

    let finalContent = followUpData?.choices?.[0]?.message?.content;
    if (Array.isArray(finalContent)) {
      finalContent = finalContent.map((p: any) => typeof p === "string" ? p : p?.text || p?.content || "").join("");
    }
    const cleanFinal = stripToolCallArtifacts(typeof finalContent === "string" ? finalContent : "").trim() || "⚠️ Empty response from model";

    return res.status(200).json({ text: cleanFinal });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || String(err) || "Internal server error" });
  }
  }
