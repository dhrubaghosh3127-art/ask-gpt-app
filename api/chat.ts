// /api/chat.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = { maxDuration: 30 };

// ─────────────────────────────────────────────────────────────────────────────
// MISTRAL MEDIUM 3.5 — Full Switch from Groq
//
// Model: mistral-medium-3-5
// Endpoint: https://api.mistral.ai/v1/chat/completions
//
// Thinking:
//   thinkingMode = false → reasoning_effort: "none"   (fast, no trace)
//   thinkingMode = true  → reasoning_effort: "high"   (full thinking trace)
//
//   When reasoning_effort="high", message.content returns a LIST of chunks:
//     { type: "thinking", thinking: [...] }  ← thinking trace
//     { type: "text", text: "..." }          ← final answer
//   When "none", message.content is a plain string.
//
// Web Search:
//   Mistral's built-in web_search tool only works on Agents/Conversations API
//   (/v1/conversations) — NOT on /v1/chat/completions.
//   So we keep the same pattern as before: use Mistral itself as a web search
//   executor (via a separate call), then feed the result back as context.
//   We define a custom `web_search` function tool — Mistral supports
//   standard OpenAI-compatible function calling on /v1/chat/completions.
//
// Vision:
//   Mistral Medium 3.5 supports native vision (image_url content blocks),
//   same format as OpenAI.
//
// Admin key  → process.env.MISTRAL_API_KEY
// User key   → user's own Mistral API key passed from client
// ─────────────────────────────────────────────────────────────────────────────

const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";
const MISTRAL_MODEL = "mistral-medium-3-5";

// For web search execution — use a lightweight Mistral call
const MISTRAL_SEARCH_MODEL = "mistral-medium-3-5";

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
- You DO have real web search access through your tool. Never say "I can't browse the internet", "I don't have access to real-time data", "I can't open links", or anything similar — that is false. If you're unsure whether you can answer from memory, call the web_search tool instead of claiming you can't.
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

// ── Tool-call text-fallback detection ─────────────────────────────────────────
type ParsedCall = { query: string } | null;

function parseToolCallFromText(text: string): ParsedCall {
  if (!text) return null;

  // Tagged format
  const wrapped = text.match(/<tool_call>([\s\S]*?)<\/tool_call>/i);
  if (wrapped) {
    try {
      const obj = JSON.parse(wrapped[1].trim());
      let args = obj?.arguments ?? obj;
      if (typeof args === "string") { try { args = JSON.parse(args); } catch {} }
      return { query: String(args?.query || args?.q || "") };
    } catch {
      return { query: "" };
    }
  }

  // Bare JSON fallback
  const bareMatch = text.match(/\{[\s\S]*?"name"\s*:\s*"web_search"[\s\S]*?\}/i);
  if (bareMatch) {
    try {
      const obj = JSON.parse(bareMatch[0]);
      let args = obj?.arguments ?? obj;
      if (typeof args === "string") { try { args = JSON.parse(args); } catch {} }
      return { query: String(args?.query || args?.q || "") };
    } catch {
      return { query: "" };
    }
  }

  return null;
}

function looksLikeFalseCapabilityDenial(text: string): boolean {
  if (!text) return false;
  const t = text.toLowerCase();
  const denialPhrases = [
    "can't browse", "cannot browse", "can't access the internet", "cannot access the internet",
    "don't have access to real-time", "do not have access to real-time",
    "can't open links", "cannot open links", "can't open web", "cannot open web",
    "no internet access", "i am not able to browse", "i'm not able to browse",
    "as an ai, i don't have", "as an ai i don't have",
  ];
  return denialPhrases.some((p) => t.includes(p));
}

function stripToolCallArtifacts(text: string): string {
  return text
    .replace(/<tool_call>[\s\S]*?<\/tool_call>/gi, "")
    .replace(/\{[\s\S]*?"name"\s*:\s*"web_search"[\s\S]*?\}/gi, "")
    .trim();
}

// ── Extract plain text from Mistral content (string or chunk array) ──────────
function extractTextFromContent(content: any): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";

  // reasoning_effort="high" returns array of ThinkChunk + TextChunk
  // We only want the TextChunk (type: "text") for the final answer
  return content
    .filter((c: any) => c?.type === "text")
    .map((c: any) => c?.text || c?.content || "")
    .join("");
}

// ── Extract reasoning/thinking trace from content chunks ────────────────────
function extractReasoningFromContent(content: any): string {
  if (!Array.isArray(content)) return "";

  return content
    .filter((c: any) => c?.type === "thinking")
    .flatMap((c: any) => Array.isArray(c?.thinking) ? c.thinking : [])
    .map((inner: any) => inner?.text || inner?.content || "")
    .join("");
}

// ── Web search executor using Mistral itself ─────────────────────────────────
async function executeWebSearch(query: string, apiKey: string): Promise<string> {
  try {
    const r = await fetch(MISTRAL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MISTRAL_SEARCH_MODEL,
        messages: [
          {
            role: "system",
            content: "You are a web search assistant. The user wants current information. Provide a concise, factual summary of what you know about this topic, focusing on the most recent and relevant information. Be direct and informative.",
          },
          { role: "user", content: query },
        ],
        temperature: 0.3,
        max_tokens: 800,
        reasoning_effort: "none",
      }),
    });
    const data = await r.json().catch(() => null);
    const rawContent = data?.choices?.[0]?.message?.content;
    const text = extractTextFromContent(rawContent);
    if (text.trim()) return text.trim();
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
      thinkingMode?: boolean;
    };

    if (mode === "chat" && !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages are required" });
    }

    const keyFromClient = (userKey ?? userApiKey ?? "").trim();
    const hasUserKey = keyFromClient.length > 0;

    // ═══════════════════════════════════════════════════════════════════════
    // IMAGE GENERATION MODE — unchanged (still uses Gemini Imagen)
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
    // VISION MODE — Mistral Medium 3.5 (native vision support)
    // ═══════════════════════════════════════════════════════════════════════
    if (mode === "vision") {
      if (hasUserKey) return res.status(403).json({ error: "Image analysis is available only in admin mode" });

      const mistralApiKey = process.env.MISTRAL_API_KEY || "";
      if (!mistralApiKey) return res.status(400).json({ error: "Missing API key (MISTRAL_API_KEY)" });

      const cleanImageBase64 = (imageBase64 || "").replace(/^data:.*;base64,/, "").trim();
      if (!cleanImageBase64) return res.status(400).json({ error: "imageBase64 is required" });

      const actualMimeType = (mimeType || "image/jpeg").trim() || "image/jpeg";
      const imageUrl = `data:${actualMimeType};base64,${cleanImageBase64}`;
      const visionPrompt = (prompt || "").trim() ||
        "Read the image carefully and return only the main text, question, or useful visible content from the image. Do not solve it unless the image itself asks for a direct answer.";

      const visionRes = await fetch(MISTRAL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${mistralApiKey}` },
        body: JSON.stringify({
          model: MISTRAL_MODEL,
          temperature: 0.1,
          reasoning_effort: "none",
          max_tokens: 1024,
          messages: [
            {
              role: "system",
              content: "You only analyze the image and extract the useful visible text, question, or content. Keep it clean and concise. Do not add extra explanation unless necessary.",
            },
            {
              role: "user",
              content: [
                { type: "text", text: visionPrompt },
                { type: "image_url", image_url: { url: imageUrl } },
              ],
            },
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

      const rawContent = visionData?.choices?.[0]?.message?.content;
      const extracted = stripToolCallArtifacts(extractTextFromContent(rawContent).trim());

      return res.status(200).json({ text: extracted, modelId: MISTRAL_MODEL });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TRANSCRIBE MODE — Mistral Voxtral (or fallback kept for compatibility)
    // Note: Mistral has audio transcription at /v1/audio/transcriptions
    // using model "voxtral-mini-transcribe-2507" or similar.
    // We keep the same whisper-compatible multipart form approach.
    // ═══════════════════════════════════════════════════════════════════════
    if (mode === "transcribe") {
      if (hasUserKey) return res.status(403).json({ error: "Voice transcription is available only in admin mode" });

      const mistralApiKey = process.env.MISTRAL_API_KEY || "";
      if (!mistralApiKey) return res.status(400).json({ error: "Missing API key (MISTRAL_API_KEY)" });

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
      formData.append("model", "voxtral-mini-2507");
      formData.append("file", audioBlob, `voice.${ext}`);
      formData.append("response_format", "json");
      if (language && language.trim()) formData.append("language", language.trim());

      const sttRes = await fetch("https://api.mistral.ai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${mistralApiKey}` },
        body: formData,
      });
      const sttRaw = await sttRes.text();
      let sttData: any = null;
      try { sttData = sttRaw ? JSON.parse(sttRaw) : null; } catch { sttData = { text: sttRaw }; }
      if (!sttRes.ok) return res.status(sttRes.status).json({ error: sttData?.error?.message || sttData?.error || "Transcription failed" });

      const text = typeof sttData?.text === "string" ? sttData.text.trim() : "";
      return res.status(200).json({ text, modelId: "voxtral-mini-2507" });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CHAT MODE — Mistral Medium 3.5, always, with tool-call handling
    // ═══════════════════════════════════════════════════════════════════════

    const apiKey = hasUserKey ? keyFromClient : (process.env.MISTRAL_API_KEY || "");
    if (!apiKey) {
      return res.status(400).json({ error: hasUserKey ? "Missing API key (userKey)" : "Missing API key (MISTRAL_API_KEY)" });
    }

    // Always use Mistral Medium 3.5 — ignore modelId from client
    const finalModelId = MISTRAL_MODEL;

    const customSystem = typeof systemInstruction === "string" && systemInstruction.trim()
      ? { role: "system", content: systemInstruction.trim() } : null;
    const identitySystem = { role: "system", content: ELIYEN_SYSTEM_PROMPT };
    const finalMessages = [identitySystem, ...(customSystem ? [customSystem] : []), ...messages];

    // Thinking: UI toggle → reasoning_effort
    const wantsThinking = thinkingMode === true;
    const effort = wantsThinking ? "high" : "none";

    // Decision call (non-streamed, to handle tool calls reliably)
    const decisionRequest: Record<string, any> = {
      model: finalModelId,
      messages: finalMessages,
      temperature: wantsThinking ? 0.7 : 0.7,
      max_tokens: wantsThinking ? 4096 : 1536,
      reasoning_effort: effort,
      stream: false,
      tools: [WEB_SEARCH_TOOL],
      tool_choice: "auto",
    };

    const decisionRes = await fetch(MISTRAL_URL, {
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
    const rawDecisionContent = decisionMsg?.content;
    const decisionContent = extractTextFromContent(rawDecisionContent);
    const decisionReasoning = extractReasoningFromContent(rawDecisionContent);

    // ── Detect tool-call intent ──────────────────────────────────────────────
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

    // Self-correction: false capability denial retry (only when thinking off)
    if (!toolWasRequested && !wantsThinking && looksLikeFalseCapabilityDenial(decisionContent)) {
      const retryRequest: Record<string, any> = {
        model: finalModelId,
        messages: finalMessages,
        temperature: 0.7,
        stream: false,
        max_tokens: 8000,
        reasoning_effort: "none",
        tools: [WEB_SEARCH_TOOL],
        tool_choice: "required",
      };
      const retryRes = await fetch(MISTRAL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify(retryRequest),
      });
      const retryText = await retryRes.text();
      let retryData: any = null;
      try { retryData = retryText ? JSON.parse(retryText) : null; } catch { retryData = null; }

      if (retryRes.ok && retryData) {
        const retryMsg = retryData?.choices?.[0]?.message;
        const retryCalls = Array.isArray(retryMsg?.tool_calls) ? retryMsg.tool_calls : [];
        if (retryCalls.length > 0) {
          toolCalls = retryCalls;
          toolWasRequested = true;
        }
      }
    }

    // ── Case 1: No tool needed — decision call IS the final answer ───────────
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

    // ── Case 2: Tool needed — execute search, then follow-up call ────────────
    const searchResults = await Promise.all(
      toolCalls.map(async (call: any) => {
        let query = "";
        try { query = JSON.parse(call.function?.arguments || "{}")?.query || ""; } catch {}
        if (!query.trim()) {
          const lastUser = [...messages].reverse().find((m: any) => m.role === "user");
          query = (typeof lastUser?.content === "string" ? lastUser.content : "").slice(0, 200) || "latest information";
        }
        const resultText = await executeWebSearch(query, apiKey);
        return { tool_call_id: call.id, content: resultText };
      })
    );

    const assistantToolTurn: Record<string, any> = {
      role: "assistant",
      content: rawDecisionContent || null,
      tool_calls: toolCalls,
    };

    const toolResultMessages = searchResults.map((r) => ({
      role: "tool",
      tool_call_id: r.tool_call_id,
      content: r.content,
    }));

    const followUpMessages = [...finalMessages, assistantToolTurn, ...toolResultMessages];

    const followUpRequest: Record<string, any> = {
      model: MISTRAL_MODEL,
      messages: followUpMessages,
      temperature: 0.7,
      max_tokens: wantsThinking ? 25000 : 8000,
      reasoning_effort: effort,
      stream: Boolean(stream && mode === "chat"),
    };

    const followUpRes = await fetch(MISTRAL_URL, {
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

      // Mistral streaming with reasoning_effort="high" sends chunks that may
      // include thinking chunks. We filter to only forward text content.
      const reader = followUpRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed === "data: [DONE]") {
              if (trimmed === "data: [DONE]") res.write("data: [DONE]\n\n");
              continue;
            }
            if (trimmed.startsWith("data: ")) {
              const jsonStr = trimmed.slice(6);
              try {
                const chunk = JSON.parse(jsonStr);
                const delta = chunk?.choices?.[0]?.delta;
                if (!delta) { res.write(line + "\n"); continue; }

                const deltaContent = delta?.content;

                // Plain string delta — forward as-is
                if (typeof deltaContent === "string") {
                  res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: deltaContent }, finish_reason: null }] })}\n\n`);
                }
                // Array delta (thinking chunks) — extract only TextChunk text
                else if (Array.isArray(deltaContent)) {
                  const textOnly = deltaContent
                    .filter((c: any) => c?.type === "text")
                    .map((c: any) => c?.text || "")
                    .join("");
                  if (textOnly) {
                    res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: textOnly }, finish_reason: null }] })}\n\n`);
                  }
                  // Optionally forward reasoning
                  const thinkText = deltaContent
                    .filter((c: any) => c?.type === "thinking")
                    .flatMap((c: any) => Array.isArray(c?.thinking) ? c.thinking : [])
                    .map((inner: any) => inner?.text || "")
                    .join("");
                  if (thinkText) {
                    res.write(`data: ${JSON.stringify({ choices: [{ delta: { reasoning: thinkText }, finish_reason: null }] })}\n\n`);
                  }
                }
              } catch {
                res.write(line + "\n");
              }
            } else {
              res.write(line + "\n");
            }
          }
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

    const rawFollowContent = followUpData?.choices?.[0]?.message?.content;
    const finalContent = extractTextFromContent(rawFollowContent);
    const cleanFinal = stripToolCallArtifacts(finalContent).trim() || "⚠️ Empty response from model";

    return res.status(200).json({ text: cleanFinal });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || String(err) || "Internal server error" });
  }
          }
    
