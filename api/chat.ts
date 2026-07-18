// /api/chat.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = { maxDuration: 30 };

const MISTRAL_AGENTS_URL = "https://api.mistral.ai/v1/agents";
const MISTRAL_CONVERSATIONS_URL = "https://api.mistral.ai/v1/conversations";
const MISTRAL_CHAT_URL = "https://api.mistral.ai/v1/chat/completions";
const MISTRAL_MODEL = "mistral-medium-latest";

const ELIYEN_INSTRUCTIONS = `
You are Eliyen, an AI assistant built by PROHOR AI.

You always know your own capabilities. Inside this app you can:
- Hold normal conversations, help with writing, coding, math, study, translation, and social media content.
- Search the web yourself when a question needs live, current, or recent information.
- Read and analyze photos and PDF documents the user sends you.
- Create images when asked to generate, draw, or design something.
- Transcribe voice input.

Keep answers direct and to the point. If a question depends on current/live/recent facts, search the web to check first rather than guessing from memory. Write math in plain notation (x^2, 1/x, sqrt(x), >=, <=), never raw LaTeX. Never mention internal model names or backend details unless asked. Be warm, direct, and genuinely helpful.
`.trim();

function safeErrorString(x: any, fallback: string): string {
  if (typeof x === "string" && x.trim()) return x.trim();
  if (Array.isArray(x) && x.length) {
    const first = x[0];
    if (typeof first === "string") return first;
    if (first?.msg) return String(first.msg);
    try { return JSON.stringify(x).slice(0, 300); } catch { return fallback; }
  }
  if (x && typeof x === "object") {
    if (typeof x.message === "string") return x.message;
    if (typeof x.msg === "string") return x.msg;
    if (typeof x.detail === "string") return x.detail;
    if (x.detail) return safeErrorString(x.detail, fallback);
    if (x.error) return safeErrorString(x.error, fallback);
    try { return JSON.stringify(x).slice(0, 300); } catch { return fallback; }
  }
  return fallback;
}

// Two cached agents — reasoning_effort is baked in at creation time, since
// completion_args cannot be sent per-conversation-call when using agent_id.
let cachedAgentNoThink: string | null = null;
let cachedAgentThink: string | null = null;

async function createAgent(apiKey: string, reasoningEffort: "none" | "high"): Promise<string> {
  const res = await fetch(MISTRAL_AGENTS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MISTRAL_MODEL,
      name: `Eliyen Agent (${reasoningEffort})`,
      description: "Eliyen's main assistant agent with live web search access.",
      instructions: ELIYEN_INSTRUCTIONS,
      tools: [{ type: "web_search" }],
      completion_args: { temperature: 0.7, reasoning_effort: reasoningEffort },
    }),
  });
  const raw = await res.text();
  let data: any = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = null; }
  if (!res.ok || !data?.id) {
    throw new Error(safeErrorString(data, `Failed to create agent (HTTP ${res.status})`));
  }
  return data.id;
}

async function getAgentId(apiKey: string, wantsThinking: boolean): Promise<string> {
  if (wantsThinking) {
    const fromEnv = (process.env.MISTRAL_AGENT_ID_THINK || "").trim();
    if (fromEnv) return fromEnv;
    if (cachedAgentThink) return cachedAgentThink;
    cachedAgentThink = await createAgent(apiKey, "high");
    return cachedAgentThink;
  }
  const fromEnv = (process.env.MISTRAL_AGENT_ID || "").trim();
  if (fromEnv) return fromEnv;
  if (cachedAgentNoThink) return cachedAgentNoThink;
  cachedAgentNoThink = await createAgent(apiKey, "none");
  return cachedAgentNoThink;
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

function extractConversationText(data: any): string {
  const outputs = Array.isArray(data?.outputs) ? data.outputs : [];
  const messageOutputs = outputs.filter((o: any) => o?.type === "message.output");
  let text = "";
  for (const out of messageOutputs) {
    const content = out?.content;
    if (typeof content === "string") text += content;
    else if (Array.isArray(content)) {
      for (const chunk of content) {
        if (typeof chunk === "string") text += chunk;
        else if (chunk?.type === "text" && typeof chunk?.text === "string") text += chunk.text;
      }
    }
  }
  return text.trim();
}

function sendErrorResponse(res: VercelResponse, status: number, message: string, isStream: boolean): void {
  if (isStream) {
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    sendDelta(res, { content: `⚠️ ${message}` });
    res.write("data: [DONE]\n\n");
    res.end();
    return;
  }
  res.status(status).json({ error: message });
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
    const isStreamReq = mode === "chat" && Boolean(stream);

    // IMAGE GENERATION MODE — unchanged (Gemini/Imagen)
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
        { method: "POST", headers: { "x-goog-api-key": geminiApiKey, "Content-Type": "application/json" },
          body: JSON.stringify({ instances: [{ prompt: imagePrompt }], parameters: { sampleCount: 1 } }) }
      );
      const imageData = await imageRes.json().catch(() => null);
      if (!imageRes.ok) return res.status(imageRes.status).json({ error: safeErrorString(imageData, "Image generation failed") });
      const imageBytes = imageData?.predictions?.[0]?.bytesBase64Encoded || imageData?.predictions?.[0]?.image?.bytesBase64Encoded || imageData?.generatedImages?.[0]?.image?.imageBytes || "";
      if (!imageBytes) return res.status(502).json({ error: "No image bytes returned from Gemini" });
      return res.status(200).json({ imageUrl: `data:image/png;base64,${imageBytes}`, modelId: actualImageModel });
    }

    // VISION MODE — plain Chat Completions
    if (mode === "vision") {
      if (hasUserKey) return res.status(403).json({ error: "Image analysis is available only in admin mode" });
      const mistralApiKey = process.env.MISTRAL_API_KEY || "";
      if (!mistralApiKey) return res.status(400).json({ error: "Missing API key (MISTRAL_API_KEY)" });
      const cleanImageBase64 = (imageBase64 || "").replace(/^data:.*;base64,/, "").trim();
      if (!cleanImageBase64) return res.status(400).json({ error: "imageBase64 is required" });
      const actualMimeType = (mimeType || "image/jpeg").trim() || "image/jpeg";
      const imageUrl = `data:${actualMimeType};base64,${cleanImageBase64}`;
      const visionPrompt = (prompt || "").trim() || "Read the image carefully and return only the main text, question, or useful visible content from the image.";
      const visionRes = await fetch(MISTRAL_CHAT_URL, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${mistralApiKey}` },
        body: JSON.stringify({ model: MISTRAL_MODEL, temperature: 0.1, messages: [
          { role: "system", content: "You only analyze the image and extract useful visible text/content. Keep it concise." },
          { role: "user", content: [{ type: "text", text: visionPrompt }, { type: "image_url", image_url: imageUrl }] },
        ]}),
      });
      const visionRaw = await visionRes.text();
      let visionData: any = null;
      try { visionData = visionRaw ? JSON.parse(visionRaw) : null; } catch { visionData = null; }
      if (!visionRes.ok) return res.status(visionRes.status).json({ error: safeErrorString(visionData, "Image analysis failed") });
      const visionContent = visionData?.choices?.[0]?.message?.content;
      let extracted = "";
      if (typeof visionContent === "string") extracted = visionContent;
      else if (Array.isArray(visionContent)) extracted = visionContent.map((p: any) => typeof p === "string" ? p : p?.text || "").join("");
      return res.status(200).json({ text: extracted.trim(), modelId: MISTRAL_MODEL });
    }

    // TRANSCRIBE MODE — unchanged (Groq Whisper)
    if (mode === "transcribe") {
      if (hasUserKey) return res.status(403).json({ error: "Voice transcription is available only in admin mode" });
      const groqApiKey = process.env.GROQ_API_KEY || "";
      if (!groqApiKey) return res.status(400).json({ error: "Missing API key (GROQ_API_KEY)" });
      const cleanBase64 = (audioBase64 || "").replace(/^data:.*;base64,/, "").trim();
      if (!cleanBase64) return res.status(400).json({ error: "audioBase64 is required" });
      const actualMimeType = (mimeType || "audio/webm").trim() || "audio/webm";
      const audioBuffer = Buffer.from(cleanBase64, "base64");
      const audioBlob = new Blob([audioBuffer], { type: actualMimeType });
      const ext = actualMimeType.includes("wav") ? "wav" : actualMimeType.includes("ogg") ? "ogg" : actualMimeType.includes("mp4") ? "mp4" : actualMimeType.includes("mp3") ? "mp3" : "webm";
      const formData = new FormData();
      formData.append("model", "whisper-large-v3-turbo");
      formData.append("file", audioBlob, `voice.${ext}`);
      formData.append("response_format", "json");
      if (language?.trim()) formData.append("language", language.trim());
      const sttRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${groqApiKey}` }, body: formData });
      const sttRaw = await sttRes.text();
      let sttData: any = null;
      try { sttData = sttRaw ? JSON.parse(sttRaw) : null; } catch { sttData = { text: sttRaw }; }
      if (!sttRes.ok) return res.status(sttRes.status).json({ error: safeErrorString(sttData, "Transcription failed") });
      return res.status(200).json({ text: (sttData?.text || "").trim(), modelId: "whisper-large-v3-turbo" });
    }

    // CHAT MODE — Mistral Conversations API
    const mistralApiKey = hasUserKey ? keyFromClient : (process.env.MISTRAL_API_KEY || "");
    if (!mistralApiKey) {
      sendErrorResponse(res, 400, hasUserKey ? "Missing API key (userKey)" : "Missing API key (MISTRAL_API_KEY)", isStreamReq);
      return;
    }

    const wantsThinking = thinkingMode === true;

    let agentId: string;
    try {
      agentId = await getAgentId(mistralApiKey, wantsThinking);
    } catch (e: any) {
      sendErrorResponse(res, 502, safeErrorString(e?.message, "Failed to prepare Mistral agent"), isStreamReq);
      return;
    }

    const customSystemText = typeof systemInstruction === "string" ? systemInstruction.trim() : "";
    const historyMessages = messages.map((m: any) => ({ role: m.role, content: m.content }));
    if (customSystemText && historyMessages.length > 0) {
      const lastIdx = historyMessages.length - 1;
      if (historyMessages[lastIdx].role === "user") {
        historyMessages[lastIdx] = { ...historyMessages[lastIdx], content: `[Context: ${customSystemText}]\n\n${historyMessages[lastIdx].content}` };
      }
    }

    // ✅ Only agent_id, inputs, store — NO completion_args here (that's what caused the error).
    const conversationBody = { agent_id: agentId, inputs: historyMessages, store: false };

    const convRes = await fetch(MISTRAL_CONVERSATIONS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${mistralApiKey}` },
      body: JSON.stringify(conversationBody),
    });
    const convRaw = await convRes.text();
    let convData: any = null;
    try { convData = convRaw ? JSON.parse(convRaw) : null; } catch { convData = null; }

    if (!convRes.ok || !convData) {
      sendErrorResponse(res, convRes.status || 502, safeErrorString(convData, convRaw.slice(0, 300) || `Upstream error (HTTP ${convRes.status})`), isStreamReq);
      return;
    }

    const finalText = extractConversationText(convData) || "⚠️ Empty response from model";

    if (isStreamReq) {
      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      writeFakeStream(res, finalText);
      return;
    }
    return res.status(200).json({ text: finalText });
  } catch (err: any) {
    return res.status(500).json({ error: safeErrorString(err?.message, "Internal server error") });
  }
                                        }
