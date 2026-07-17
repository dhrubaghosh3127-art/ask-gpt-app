// /api/chat.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = { maxDuration: 30 };

const MISTRAL_AGENTS_URL = "https://api.mistral.ai/v1/agents";
const MISTRAL_CONVERSATIONS_URL = "https://api.mistral.ai/v1/conversations";
const MISTRAL_CHAT_URL = "https://api.mistral.ai/v1/chat/completions";
const MISTRAL_MODEL = "mistral-medium-latest"; // currently resolves to Mistral Medium 3.5

// ─────────────────────────────────────────────────────────────────────────────
// CORRECTED, using Mistral's REAL native web_search — no Groq involved for
// search anymore. Confirmed from Mistral's own official docs:
//   - web_search / web_search_premium only work on the Conversations API
//     (/v1/conversations) and the Agents API — NOT on Chat Completions.
//   - Tools like web_search are configured on an Agent (created once via
//     POST /v1/agents), then every conversation uses that agent_id.
//
// This file auto-creates (and caches, per warm serverless instance) one
// websearch-enabled agent, then sends every chat message through
// POST /v1/conversations using that agent — no manual setup step needed.
//
// Each call is treated as a fresh, stateless "start" with the full message
// history as `inputs` (store: false) — same stateless pattern as before;
// the client (Android/web) still owns and resends full history, Mistral's
// cloud never persists it.
// ─────────────────────────────────────────────────────────────────────────────

const ELIYEN_INSTRUCTIONS = `
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

// Cached across warm invocations of the same serverless instance. On a cold
// start this will be empty again and a fresh agent gets created — cheap and
// harmless, just avoids needing any manual one-time setup step.
let cachedAgentId: string | null = null;

async function getOrCreateWebsearchAgent(apiKey: string): Promise<string> {
  if (cachedAgentId) return cachedAgentId;

  const res = await fetch(MISTRAL_AGENTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MISTRAL_MODEL,
      name: "Eliyen Agent",
      description: "Eliyen's main assistant agent with live web search access.",
      instructions: ELIYEN_INSTRUCTIONS,
      tools: [{ type: "web_search" }],
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.id) {
    throw new Error(data?.message || data?.error?.message || `Failed to create agent (HTTP ${res.status})`);
  }

  cachedAgentId = data.id;
  return cachedAgentId;
}

function sendDelta(res: VercelResponse, delta: Record<string, any>) {
  res.write(`data: ${JSON.stringify({ choices: [{ delta, finish_reason: null }] })}\n\n`);
}

function writeFakeStream(res: VercelResponse, content: string) {
  const chunkSize = 28;
  for (let i = 0; i < content.length; i += chunkSize) {
    sendDelta(res, { content: content.slice(i, i + chunkSize) });
  }
  res.write("data: [DONE]\n\n");
  res.end();
}

// Extracts plain text from a Conversations API response's `outputs` array —
// pulls every `message.output` entry's text chunks and joins them.
function extractConversationText(data: any): string {
  const outputs = Array.isArray(data?.outputs) ? data.outputs : [];
  const messageOutputs = outputs.filter((o: any) => o?.type === "message.output");
  let text = "";
  for (const out of messageOutputs) {
    const content = out?.content;
    if (typeof content === "string") {
      text += content;
    } else if (Array.isArray(content)) {
      for (const chunk of content) {
        if (typeof chunk === "string") text += chunk;
        else if (chunk?.type === "text" && typeof chunk?.text === "string") text += chunk.text;
      }
    }
  }
  return text.trim();
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
    // VISION MODE — plain Chat Completions (native multimodal, no search
    // needed here, so the simpler endpoint is fine and faster). ─────────────
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

      const visionRes = await fetch(MISTRAL_CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${mistralApiKey}` },
        body: JSON.stringify({
          model: MISTRAL_MODEL,
          temperature: 0.1,
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
    // CHAT MODE — Mistral Conversations API, real native web_search
    // ═══════════════════════════════════════════════════════════════════════

    const mistralApiKey = hasUserKey ? keyFromClient : (process.env.MISTRAL_API_KEY || "");
    if (!mistralApiKey) {
      return res.status(400).json({ error: hasUserKey ? "Missing API key (userKey)" : "Missing API key (MISTRAL_API_KEY)" });
    }

    const wantsThinking = thinkingMode === true;

    let agentId: string;
    try {
      agentId = await getOrCreateWebsearchAgent(mistralApiKey);
    } catch (e: any) {
      const msg = e?.message || "Failed to prepare Mistral agent";
      if (mode === "chat" && stream) {
        res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        sendDelta(res, { content: `⚠️ ${msg}` });
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }
      return res.status(502).json({ error: msg });
    }

    // Any per-request custom system content (e.g. category prompts from the
    // client) is layered on top of the agent's own base instructions.
    const customSystem = typeof systemInstruction === "string" && systemInstruction.trim()
      ? [{ role: "system", content: systemInstruction.trim() }] : [];

    const conversationInputs = [
      ...customSystem,
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    const conversationBody: Record<string, any> = {
      agent_id: agentId,
      inputs: conversationInputs,
      store: false, // stateless — client already resends full history each time
      completion_args: {
        temperature: 0.7,
        reasoning_effort: wantsThinking ? "high" : "none",
      },
    };

    const convRes = await fetch(MISTRAL_CONVERSATIONS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${mistralApiKey}` },
      body: JSON.stringify(conversationBody),
    });

    const convRaw = await convRes.text();
    let convData: any = null;
    try { convData = convRaw ? JSON.parse(convRaw) : null; } catch { convData = null; }

    if (!convRes.ok || !convData) {
      const realMsg = convData?.message || convData?.error?.message || convRaw.slice(0, 300) || `Upstream error (HTTP ${convRes.status})`;
      if (mode === "chat" && stream) {
        res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        sendDelta(res, { content: `⚠️ ${realMsg}` });
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }
      return res.status(convRes.status || 502).json({ error: realMsg });
    }

    const finalText = extractConversationText(convData) || "⚠️ Empty response from model";

    if (mode === "chat" && stream) {
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      writeFakeStream(res, finalText);
      return;
    }

    return res.status(200).json({ text: finalText });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || String(err) || "Internal server error" });
  }
  }
