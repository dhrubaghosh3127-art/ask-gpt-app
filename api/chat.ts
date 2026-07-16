// /api/chat.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = { maxDuration: 30 };

const MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions";
const MISTRAL_MODEL = "mistral-medium-latest"; // currently resolves to Mistral Medium 3.5

// ─────────────────────────────────────────────────────────────────────────────
// Mistral Medium 3.5 — the default for everything (chat, thinking, vision,
// web search), added the same simple way Groq/Gemini are called elsewhere
// in this file: one direct fetch to the provider's own endpoint.
//
//   web search → tools: [{ type: "web_search" }] — Mistral's own official,
//                built-in, SERVER-SIDE tool. Mistral decides for itself
//                whether to search, and executes it internally — no custom
//                function definitions, no manual search execution, no
//                tool_call_id bookkeeping needed on our side at all.
//
//   thinking   → reasoning_effort: "high" | "none", same simple toggle
//                pattern already used elsewhere (client's thinkingMode).
//
//   vision     → Mistral Medium 3.5 has native multimodal vision built in.
// ─────────────────────────────────────────────────────────────────────────────

const ELIYEN_SYSTEM_PROMPT = `
You are Eliyen, an AI assistant built by PROHOR AI.

You always know your own capabilities — you never have to guess, hedge, or say
"I can't do that" just because you personally don't perform a step directly,
if the app around you supports it. Inside this app you can:
- Hold normal conversations, help with writing, coding, math, study, translation, and social media content.
- Search the web yourself when a question needs live, current, or recent information.
- Read and analyze photos and PDF documents the user sends you.
- Create images when asked to generate, draw, or design something.
- Transcribe voice input.

How you answer:
- Keep answers direct and to the point. Don't pad simple questions with unnecessary explanation.
- If a question depends on current/live/recent facts (news, prices, scores, weather, "today", anything that could have changed recently or is after your training), search the web to check first rather than guessing from memory.
- Write math in plain, ordinary notation people can read normally: x^2, 1/x, sqrt(x), (a+b), >=, <=. Never output raw LaTeX commands like \\frac, \\sqrt{}, \\ge, or \\[ ... \\].
- Never mention internal model names, backend routing, or tool implementation details unless the user explicitly asks how the app works technically.
- Be warm, direct, and genuinely helpful — like a sharp, knowledgeable friend, not a corporate script.
`.trim();

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
    // IMAGE GENERATION MODE — unchanged (Gemini/Imagen)
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
    // VISION MODE — Mistral Medium 3.5 (native multimodal)
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
          messages: [
            { role: "system", content: "You only analyze the image and extract the useful visible text, question, or content. Keep it clean and concise. Do not add extra explanation unless necessary." },
            { role: "user", content: [
              { type: "text", text: visionPrompt },
              { type: "image_url", image_url: imageUrl },
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
          typeof p === "string" ? p : typeof p?.text === "string" ? p.text : ""
        ).join("");
      }

      return res.status(200).json({ text: extracted.trim(), modelId: MISTRAL_MODEL });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // TRANSCRIBE MODE — unchanged (Groq Whisper)
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
    // CHAT MODE — Mistral Medium 3.5, always, with built-in web_search
    // ═══════════════════════════════════════════════════════════════════════

    const mistralApiKey = hasUserKey ? keyFromClient : (process.env.MISTRAL_API_KEY || "");
    if (!mistralApiKey) {
      return res.status(400).json({ error: hasUserKey ? "Missing API key (userKey)" : "Missing API key (MISTRAL_API_KEY)" });
    }

    const finalModelId = modelId && modelId !== "auto" ? modelId : MISTRAL_MODEL;

    const customSystem = typeof systemInstruction === "string" && systemInstruction.trim()
      ? { role: "system", content: systemInstruction.trim() } : null;
    const identitySystem = { role: "system", content: ELIYEN_SYSTEM_PROMPT };
    const finalMessages = [identitySystem, ...(customSystem ? [customSystem] : []), ...messages];

    const wantsThinking = thinkingMode === true;

    const requestBody: Record<string, any> = {
      model: finalModelId,
      messages: finalMessages,
      temperature: 0.7,
      reasoning_effort: wantsThinking ? "high" : "none",
      tools: [{ type: "web_search" }], // official, built-in, server-side — Mistral decides and executes itself
      stream: Boolean(stream),
    };

    // ── Streaming path — Mistral's built-in web_search runs entirely on
    // their servers, so a single streamed call is all that's needed, same
    // as any other provider in this file. ─────────────────────────────────
    if (mode === "chat" && stream) {
      const upstream = await fetch(MISTRAL_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${mistralApiKey}` },
        body: JSON.stringify(requestBody),
      });

      if (!upstream.ok || !upstream.body) {
        const errText = await upstream.text();
        let errData: any = null;
        try { errData = errText ? JSON.parse(errText) : null; } catch { errData = null; }
        const realMsg = errData?.error?.message || errData?.message || errText.slice(0, 300) || `Upstream error (HTTP ${upstream.status})`;
        return res.status(upstream.status || 502).json({ error: realMsg });
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
      } catch (e: any) {
        res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: `\n\n[Connection error: ${e?.message || "stream interrupted"}]` } }] })}\n\n`);
      }
      res.end();
      return;
    }

    // ── Non-streaming path ────────────────────────────────────────────────
    const upstream = await fetch(MISTRAL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${mistralApiKey}` },
      body: JSON.stringify({ ...requestBody, stream: false }),
    });
    const rawBody = await upstream.text();
    let data: any = null;
    try { data = rawBody ? JSON.parse(rawBody) : null; } catch { data = null; }

    if (!upstream.ok) {
      const msg = data?.error?.message || data?.message || rawBody?.slice(0, 300) || `Upstream error (HTTP ${upstream.status})`;
      return res.status(upstream.status).json({ error: msg });
    }
    if (!data) return res.status(502).json({ error: rawBody?.slice(0, 300) || "Invalid response from provider" });

    const msg0 = data?.choices?.[0]?.message;
    const content0 = msg0?.content;
    let raw = "";
    if (typeof content0 === "string") raw = content0;
    else if (Array.isArray(content0)) {
      raw = content0.map((p: any) => typeof p === "string" ? p : p?.text || "").join("");
    }
    const cleaned = raw.trim() || "⚠️ Empty response from model";

    return res.status(200).json({ text: cleaned });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || String(err) || "Internal server error" });
  }
      }
      
