// /api/chat.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// ─────────────────────────────────────────────────────────────────────────────
// Model roles (single source of truth for this backend file):
//
//   qwen/qwen3.6-27b    → THE default model for everyone (admin key + user's
//                         own key, same path). Handles normal chat, photo
//                         analysis (multimodal), PDF text analysis, math,
//                         code, and decides for itself — via its own hybrid
//                         thinking training — how much to reason per question.
//                         Also owns the custom `web_search` function tool.
//
//   groq/compound       → NEVER chosen directly as the chat model anymore.
//                         Used only as the internal search EXECUTOR: when
//                         Qwen's tool call asks for `web_search`, this backend
//                         calls groq/compound itself to fetch grounded real
//                         results, then feeds that back to Qwen to compose
//                         the final natural-language reply. The user never
//                         sees raw JSON — only Qwen's finished answer.
//
//   openai/gpt-oss-120b → kept available as a manually-selectable model
//                         (still has its own excellent native browser_search
//                         tool, unchanged, zero-orchestration). Not the
//                         automatic default anymore, but still used wherever
//                         it's explicitly chosen.
// ─────────────────────────────────────────────────────────────────────────────

const QWEN_MODEL     = "qwen/qwen3.6-27b";
const COMPOUND_MODEL = "groq/compound";
const GPT_OSS_MODEL  = "openai/gpt-oss-120b";

const ELIYEN_SYSTEM_PROMPT = `
You are Eliyen, an AI assistant built by PROHOR AI.

You always know your own capabilities — you never have to guess, hedge, or say
"I can't do that" just because you personally don't perform a step directly,
if the app around you supports it. Inside this app you can:
- Hold normal conversations, help with writing, coding, math, study, translation, and social media content.
- Search the web yourself when a question needs live, current, or recent information — call your web_search tool when you judge it's genuinely needed, quietly, without announcing it unless it's natural to mention.
- Read and analyze photos and PDF documents the user sends you.
- Create images when asked to generate, draw, or design something.
- Transcribe voice input.

How you think and answer:
- Understand what the user actually wants before responding. Simple questions get short, direct answers with no unnecessary reasoning. Complex tasks (math, coding, logic, multi-step reasoning) get careful step-by-step thinking before you give a clear final answer. You decide this yourself, per question — don't overthink easy things.
- If a question depends on current/live/recent facts (news, prices, scores, weather, "today", anything that could have changed recently or is after your training), call the web_search tool to check first rather than guessing from memory.
- After a tool result comes back, always write your final answer yourself in plain natural language — never show raw JSON, tool syntax, or code blocks of tool output to the user.
- Write math in plain, ordinary notation people can read normally: x^2, 1/x, sqrt(x), (a+b), >=, <=. Never output raw LaTeX commands like \\frac, \\sqrt{}, \\ge, or \\[ ... \\].
- Never mention internal model names, backend routing, or tool implementation details unless the user explicitly asks how the app works technically.
- Be warm, direct, and genuinely helpful — like a sharp, knowledgeable friend, not a corporate script.
`.trim();

// Custom function tool — Qwen decides on its own when to call this.
// The backend (not Qwen) actually executes the search via groq/compound.
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

// Executes a real web search via Groq's compound system and returns
// grounded plain-text findings for the main model to read and use.
async function executeWebSearch(query: string, apiKey: string): Promise<string> {
  try {
    const r = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
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
  } catch {
    return `Web search failed for: ${query}`;
  }
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
      audioBase64, imageBase64, mimeType, language, stream,
    } = body as {
      modelId?: string; messages?: any[]; userKey?: string; userApiKey?: string;
      prompt?: string; systemInstruction?: string;
      mode?: "chat" | "image" | "transcribe" | "vision";
      audioBase64?: string; imageBase64?: string; mimeType?: string;
      language?: string; stream?: boolean;
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
          error: imageData?.error?.message || imageData?.error || "Image generation failed", data: imageData,
        });
      }
      const imageBytes =
        imageData?.predictions?.[0]?.bytesBase64Encoded ||
        imageData?.predictions?.[0]?.image?.bytesBase64Encoded ||
        imageData?.generatedImages?.[0]?.image?.imageBytes || "";
      if (!imageBytes) return res.status(502).json({ error: "No image bytes returned from Gemini", data: imageData });

      return res.status(200).json({ imageUrl: `data:image/png;base64,${imageBytes}`, modelId: actualImageModel });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // VISION MODE — now on qwen/qwen3.6-27b (llama-4-scout is deprecated)
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
          error: visionData?.error?.message || visionData?.error || visionData?.message || visionRaw.slice(0, 250) || "Image analysis failed",
          data: visionData,
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
      extracted = extracted.trim();

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
      if (!sttRes.ok) return res.status(sttRes.status).json({ error: sttData?.error?.message || sttData?.error || "Transcription failed", data: sttData });

      const text = typeof sttData?.text === "string" ? sttData.text.trim() : "";
      return res.status(200).json({ text, modelId: "whisper-large-v3-turbo" });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CHAT MODE — Qwen 3.6 27B smart default, with token-efficient tool use
    // ═══════════════════════════════════════════════════════════════════════

    const apiKey = hasUserKey ? keyFromClient : (process.env.GROQ_API_KEY || "");
    if (!apiKey) {
      return res.status(400).json({ error: hasUserKey ? "Missing API key (userKey)" : "Missing API key (GROQ_API_KEY)" });
    }

    // Same model, same path, for admin key and BYOK alike — unless the user
    // manually picked a specific model (e.g. GPT-OSS) from the model picker.
    const finalModelId = modelId && modelId !== "auto" ? modelId : QWEN_MODEL;

    const customSystem = typeof systemInstruction === "string" && systemInstruction.trim()
      ? { role: "system", content: systemInstruction.trim() } : null;
    const identitySystem = { role: "system", content: ELIYEN_SYSTEM_PROMPT };
    const finalMessages = [identitySystem, ...(customSystem ? [customSystem] : []), ...messages];

    const isQwen   = finalModelId === QWEN_MODEL;
    const isGptOss = finalModelId === GPT_OSS_MODEL;

    const baseRequest: Record<string, any> = {
      model: finalModelId,
      messages: finalMessages,
      temperature: 0.7,
    };

    if (isQwen) {
      // Qwen decides its own reasoning depth per question via its native
      // hybrid training — "default" just keeps thinking available, it does
      // not force long output on simple messages.
      baseRequest.max_completion_tokens = 4096;
      baseRequest.reasoning_effort = "default";
      baseRequest.reasoning_format = "parsed"; // required alongside tool use
      baseRequest.tools = [WEB_SEARCH_TOOL];
      baseRequest.tool_choice = "auto";
    } else if (isGptOss) {
      baseRequest.max_completion_tokens = 4096;
      baseRequest.reasoning_effort = "high";
      baseRequest.tools = [{ type: "browser_search" }]; // native, zero-orchestration
    } else if (finalModelId === COMPOUND_MODEL) {
      // groq/compound already fully agentic on its own — no extra tools param.
    } else {
      baseRequest.max_tokens = 2048;
    }

    // ── GPT-OSS path — its native browser_search is handled entirely
    // server-side by Groq itself, so it can stream directly like before. ────
    if (mode === "chat" && stream && isGptOss) {
      const upstream = await fetch(GROQ_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ ...baseRequest, stream: true }),
      });
      if (!upstream.ok || !upstream.body) {
        const t = await upstream.text();
        return res.status(upstream.status).json({ error: t.slice(0, 250) || "API Error" });
      }
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(decoder.decode(value, { stream: true }));
        }
      } catch {}
      res.end();
      return;
    }

    // ── Qwen path — custom web_search function tool, backend-orchestrated. ──
    // The decision call is ALSO streamed now (not just the follow-up), so
    // the client sees exactly what's really happening, live, moment to
    // moment: real reasoning text while Qwen thinks, a live "Searching: X"
    // status the instant a tool call is detected, then the real final
    // answer streaming in — never silence, never anything fabricated.
    if (mode === "chat" && stream && isQwen) {
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");

      const sendDelta = (delta: Record<string, any>) => {
        res.write(`data: ${JSON.stringify({ choices: [{ delta, finish_reason: null }] })}\n\n`);
      };

      const decisionUpstream = await fetch(GROQ_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({ ...baseRequest, stream: true }),
      });

      if (!decisionUpstream.ok || !decisionUpstream.body) {
        sendDelta({ content: "Something went wrong, please try again." });
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }

      const reader  = decisionUpstream.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = "";

      // Tool-call fragments arrive across multiple chunks, indexed —
      // accumulate name/arguments per index until the stream tells us
      // finish_reason === "tool_calls".
      const toolCallAcc: Record<number, { id: string; name: string; args: string }> = {};
      let sawToolCall = false;

      readLoop: while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        sseBuffer += decoder.decode(value, { stream: true });
        const lines = sseBuffer.split("\n");
        sseBuffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") break readLoop;
          if (!payload) continue;

          let obj: any;
          try { obj = JSON.parse(payload); } catch { continue; }
          const delta = obj?.choices?.[0]?.delta;
          if (!delta) continue;

          // Real reasoning, live, exactly as Qwen produces it.
          if (typeof delta.reasoning === "string" && delta.reasoning.length > 0) {
            sendDelta({ reasoning: delta.reasoning });
          }
          // Real answer, live — this only happens when no tool is needed.
          if (typeof delta.content === "string" && delta.content.length > 0) {
            sendDelta({ content: delta.content });
          }
          // Tool call being requested — accumulate quietly, say nothing yet
        
        // until we have a usable query to show.
          if (Array.isArray(delta.tool_calls)) {
            sawToolCall = true;
            for (const tc of delta.tool_calls) {
              const idx = tc.index ?? 0;
              if (!toolCallAcc[idx]) toolCallAcc[idx] = { id: "", name: "", args: "" };
              if (tc.id) toolCallAcc[idx].id += tc.id;
              if (tc.function?.name) toolCallAcc[idx].name += tc.function.name;
              if (tc.function?.arguments) toolCallAcc[idx].args += tc.function.arguments;
            }
          }
        }
      }

      if (sawToolCall && Object.keys(toolCallAcc).length > 0) {
        const toolCallsForFollowUp = Object.entries(toolCallAcc).map(([idx, tc]) => ({
          id: tc.id || `call_${idx}`,
          type: "function",
          function: { name: tc.name || "web_search", arguments: tc.args || "{}" },
        }));

        const toolResultMessages: any[] = [];
        for (const call of toolCallsForFollowUp) {
          let query = "";
          try { query = JSON.parse(call.function.arguments || "{}")?.query || ""; } catch {}
          // Live, honest status — shown the instant we know what's being
          // searched, right before the actual (real) network delay happens.
          sendDelta({ reasoning: `\n\n🔎 Searching: ${query || "the web"}...\n` });
          const resultText = await executeWebSearch(query || "latest information", apiKey);
          toolResultMessages.push({ role: "tool", tool_call_id: call.id, content: resultText });
        }

        const followUpMessages = [
          ...finalMessages,
          { role: "assistant", content: null, tool_calls: toolCallsForFollowUp },
          ...toolResultMessages,
        ];

        const finalUpstream = await fetch(GROQ_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
          body: JSON.stringify({
            model: QWEN_MODEL,
            messages: followUpMessages,
            temperature: 0.7,
            max_completion_tokens: 4096,
            reasoning_effort: "default",
            reasoning_format: "parsed",
            stream: true,
          }),
        });

        if (!finalUpstream.ok || !finalUpstream.body) {
          sendDelta({ content: "Search failed, please try again." });
          res.write("data: [DONE]\n\n");
          res.end();
          return;
        }

        const reader2  = finalUpstream.body.getReader();
        const decoder2 = new TextDecoder();
        try {
          while (true) {
            const { done, value } = await reader2.read();
            if (done) break;
            res.write(decoder2.decode(value, { stream: true }));
          }
        } catch {}
        res.end();
        return;
      }

      // No tool call — everything (reasoning + content) already streamed
      // live above, in real time, as a single API call.
      res.write("data: [DONE]\n\n");
      res.end();
      return;
    }

    // ── Non-streaming path (any model, mode==="chat" && !stream) ─────────────
    const upstream = await fetch(GROQ_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ ...baseRequest, stream: false }),
    });
    const rawBody = await upstream.text();
    let data: any = null;
    try { data = rawBody ? JSON.parse(rawBody) : null; } catch { data = null; }

    if (!upstream.ok) {
      const msg = data?.error?.message || data?.error || data?.message || rawBody?.slice(0, 250) || "API Error";
      return res.status(upstream.status).json({ error: msg, data });
    }
    if (!data) return res.status(502).json({ error: rawBody?.slice(0, 250) || "Invalid response from provider" });

    let msg0 = data?.choices?.[0]?.message;
    const toolCalls0 = msg0?.tool_calls;

    if (Array.isArray(toolCalls0) && toolCalls0.length > 0) {
      const toolResultMessages: any[] = [];
      for (const call of toolCalls0) {
        let query = "";
        try { query = JSON.parse(call.function?.arguments || "{}")?.query || ""; } catch {}
        const resultText = await executeWebSearch(query || "latest information", apiKey);
        toolResultMessages.push({ role: "tool", tool_call_id: call.id, content: resultText });
      }
      const followUp = await fetch(GROQ_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: QWEN_MODEL,
          messages: [...finalMessages, { role: "assistant", content: msg0?.content ?? null, tool_calls: toolCalls0 }, ...toolResultMessages],
          temperature: 0.7,
          max_completion_tokens: 4096,
          reasoning_effort: "default",
          reasoning_format: "parsed",
          stream: false,
        }),
      });
      const followUpData = await followUp.json().catch(() => null);
      msg0 = followUpData?.choices?.[0]?.message ?? msg0;
    }

    const content0 = msg0?.content;
    let raw = "";
    if (typeof content0 === "string") raw = content0;
    else if (Array.isArray(content0)) {
      raw = content0.map((p: any) => typeof p === "string" ? p : p?.text || p?.content || "").join("");
    }
    const cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim() || "⚠️ Empty response from model";

    return res.status(200).json({ text: cleaned });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || "Internal server error" });
  }
}
