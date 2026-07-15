// /api/chat.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = { maxDuration: 30 };

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// ─────────────────────────────────────────────────────────────────────────────
// Qwen 3.6 27B for everything (chat, thinking, vision) — fixes applied from
// Groq's own official Tool Use docs + Alibaba's own official example code:
//
//  1. Tool-decision call ALWAYS uses reasoning_effort "none", regardless of
//     the user's thinkingMode toggle. Alibaba's own official function-
//     calling example uses enable_thinking=False specifically for tool
//     calls — thinking mode measurably hurts tool-call reliability for
//     this model family. Thinking (if requested) is applied to the real,
//     final answer instead — either the follow-up call after a tool
//     result, or a second no-tools call when no search was needed.
//
//  2. Tool result messages now include the required `name` field, matching
//     Groq's own official example exactly:
//       { role: "tool", tool_call_id, name, content }
//     This was missing before — a confirmed, concrete bug.
//
//  3. The assistant's own tool_calls turn is included in the follow-up
//     (never skipped), using the correct `role: "tool"` for results (never
//     a fake "role: user" message) — the official documented structure.
//
//  4. A text-based `<tool_call>{"name":...}</tool_call>` fallback parser is
//     kept as a genuine safety net, not a patch: Qwen's own docs recommend
//     "Hermes-style" tool use, meaning the model is natively inclined to
//     emit this exact tagged-JSON text format regardless of the API
//     wrapper, so this fallback is expected to matter sometimes.
//
//  5. qwen/qwen3.6-27b has no Built-In Tools support on Groq (confirmed:
//     console.groq.com/docs/tool-use/overview) — only Local Tool Calling,
//     which is what this implements. groq/compound remains the search
//     executor once Qwen requests it.
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

You DO have real web search access through your tool. Never say "I can't
browse the internet", "I don't have access to real-time data", "I can't
open links", or anything similar — that is false.

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
      "Search the live web for current, recent, or real-time information — news, prices, scores, dates, facts that may have changed recently, or anything your own knowledge might be outdated on. Only call this when the question genuinely needs it. Can be called more than once in the same turn for independent lookups.",
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

// Official Hermes-style native format safety net:
// <tool_call>{"name": "web_search", "arguments": {"query": "..."}}</tool_call>
function parseToolCallFromText(text: string): { query: string } | null {
  if (!text || !text.includes("<tool_call")) return null;
  const wrapped = text.match(/<tool_call>([\s\S]*?)<\/tool_call>/i);
  if (!wrapped) return null;
  try {
    const obj = JSON.parse(wrapped[1].trim());
    let args = obj?.arguments ?? obj;
    if (typeof args === "string") { try { args = JSON.parse(args); } catch {} }
    return { query: String(args?.query || args?.q || "") };
  } catch {
    return { query: "" };
  }
}

function stripToolCallArtifacts(text: string): string {
  return text.replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, "").trim();
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

async function callGroq(apiKey: string, payload: Record<string, any>) {
  const r = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ ...payload, stream: false }),
  });
  const raw = await r.text();
  let data: any = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = null; }
  return { ok: r.ok, status: r.status, raw, data };
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
      thinkingMode?: boolean;
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
    // VISION MODE — Qwen 3.6 27B
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
    // CHAT MODE
    // ═══════════════════════════════════════════════════════════════════════

    const apiKey = hasUserKey ? keyFromClient : (process.env.GROQ_API_KEY || "");
    if (!apiKey) {
      return res.status(400).json({ error: hasUserKey ? "Missing API key (userKey)" : "Missing API key (GROQ_API_KEY)" });
    }

    const finalModelId = modelId && modelId !== "auto" ? modelId : QWEN_MODEL;

    const customSystem = typeof systemInstruction === "string" && systemInstruction.trim()
      ? { role: "system", content: systemInstruction.trim() } : null;
    const identitySystem = { role: "system", content: ELIYEN_SYSTEM_PROMPT };
    const finalMessages = [identitySystem, ...(customSystem ? [customSystem] : []), ...messages];

    const wantsThinking = thinkingMode === true;

    // ── Step 1 — tool-decision call. Thinking is ALWAYS off here, matching
    // Alibaba's own official example for reliable function calling. ────────
    const decisionResult = await callGroq(apiKey, {
      model: finalModelId,
      messages: finalMessages,
      temperature: 0.7,
      max_completion_tokens: 1536,
      reasoning_effort: "none",
      reasoning_format: "hidden",
      tools: [WEB_SEARCH_TOOL],
      tool_choice: "auto",
    });

    if (!decisionResult.ok || !decisionResult.data) {
      const realMsg = decisionResult.data?.error?.message || decisionResult.data?.error || decisionResult.raw.slice(0, 300) || `Upstream error (HTTP ${decisionResult.status})`;
      if (mode === "chat" && stream) {
        res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        sendDelta(res, { content: `⚠️ ${realMsg}` });
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }
      return res.status(decisionResult.status || 502).json({ error: realMsg });
    }

    const decisionMsg = decisionResult.data?.choices?.[0]?.message;
    let decisionContent = decisionMsg?.content;
    if (Array.isArray(decisionContent)) {
      decisionContent = decisionContent.map((p: any) => typeof p === "string" ? p : p?.text || p?.content || "").join("");
    }
    decisionContent = typeof decisionContent === "string" ? decisionContent : "";

    let toolCalls: any[] = Array.isArray(decisionMsg?.tool_calls) ? decisionMsg.tool_calls : [];
    let toolWasRequested = toolCalls.length > 0;

    if (!toolWasRequested) {
      const textParsed = parseToolCallFromText(decisionContent);
      if (textParsed && textParsed.query.trim()) {
        toolWasRequested = true;
        toolCalls = [{
          id: "call_textfallback_0",
          type: "function",
          function: { name: "web_search", arguments: JSON.stringify({ query: textParsed.query }) },
        }];
      }
    }

    // ── Case 1: no tool needed ────────────────────────────────────────────────
    if (!toolWasRequested) {
      // If the user asked for thinking mode, this no-think decision call
      // isn't the answer they want yet — get a real, thought-out answer now.
      if (wantsThinking) {
        const thinkResult = await callGroq(apiKey, {
          model: QWEN_MODEL,
          messages: finalMessages,
          temperature: 0.7,
          max_completion_tokens: 4096,
          reasoning_effort: "default",
          reasoning_format: "parsed",
        });

        if (!thinkResult.ok || !thinkResult.data) {
          const realMsg = thinkResult.data?.error?.message || thinkResult.raw.slice(0, 300) || "Thinking call failed";
          if (mode === "chat" && stream) {
            res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
            sendDelta(res, { content: `⚠️ ${realMsg}` });
            res.write("data: [DONE]\n\n");
            res.end();
            return;
          }
          return res.status(thinkResult.status || 502).json({ error: realMsg });
        }

        const thinkMsg = thinkResult.data?.choices?.[0]?.message;
        let thinkContent = thinkMsg?.content;
        if (Array.isArray(thinkContent)) {
          thinkContent = thinkContent.map((p: any) => typeof p === "string" ? p : p?.text || p?.content || "").join("");
        }
        const cleanThink = stripToolCallArtifacts(typeof thinkContent === "string" ? thinkContent : "").trim() || "⚠️ Empty response from model";
        const thinkReasoning = typeof thinkMsg?.reasoning === "string" ? thinkMsg.reasoning : "";

        if (mode === "chat" && stream) {
          res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
          res.setHeader("Cache-Control", "no-cache, no-transform");
          res.setHeader("Connection", "keep-alive");
          if (thinkReasoning.trim()) sendDelta(res, { reasoning: thinkReasoning.trim() });
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

    // ── Case 2: tool needed — official structure, WITH the required `name`
    // field on each tool result message (the confirmed missing piece). ──────
    const searchResults = await Promise.all(
      toolCalls.map(async (call: any) => {
        let query = "";
        try { query = JSON.parse(call.function?.arguments || "{}")?.query || ""; } catch {}
        if (!query.trim()) {
          const lastUser = [...messages].reverse().find((m: any) => m.role === "user");
          query = (typeof lastUser?.content === "string" ? lastUser.content : "").slice(0, 200) || "latest information";
        }
        const resultText = await executeWebSearch(query, apiKey);
        return {
          tool_call_id: call.id,
          name: call.function?.name || "web_search",
          content: resultText,
        };
      })
    );

    const assistantToolTurn: Record<string, any> = {
      role: "assistant",
      content: decisionContent || null,
      tool_calls: toolCalls,
    };

    const toolResultMessages = searchResults.map((r) => ({
      role: "tool",
      tool_call_id: r.tool_call_id,
      name: r.name,
      content: r.content,
    }));

    const followUpMessages = [...finalMessages, assistantToolTurn, ...toolResultMessages];

    // Thinking (if the user asked for it) applies here — the real answer,
    // now grounded with search results. No tools this round, so the model
    // must give a final natural-language answer.
    const followUpPayload: Record<string, any> = {
      model: QWEN_MODEL,
      messages: followUpMessages,
      temperature: 0.7,
      max_completion_tokens: wantsThinking ? 4096 : 1536,
      reasoning_effort: wantsThinking ? "default" : "none",
      reasoning_format: wantsThinking ? "parsed" : "hidden",
    };

    if (mode === "chat" && stream) {
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");

      const followUpRes = await fetch(GROQ_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ ...followUpPayload, stream: true }),
      });

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

    const followUpResult = await callGroq(apiKey, followUpPayload);

    if (!followUpResult.ok || !followUpResult.data) {
      const realMsg = followUpResult.data?.error?.message || followUpResult.raw.slice(0, 300) || "Search follow-up failed";
      return res.status(followUpResult.status || 502).json({ error: realMsg });
    }

    let finalContent = followUpResult.data?.choices?.[0]?.message?.content;
    if (Array.isArray(finalContent)) {
      finalContent = finalContent.map((p: any) => typeof p === "string" ? p : p?.text || p?.content || "").join("");
    }
    const cleanFinal = stripToolCallArtifacts(typeof finalContent === "string" ? finalContent : "").trim() || "⚠️ Empty response from model";

    return res.status(200).json({ text: cleanFinal });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || String(err) || "Internal server error" });
  }
            }
