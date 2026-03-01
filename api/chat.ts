// /api/chat.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // (optional) basic CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body ?? {});

const { modelId, messages, userKey, userApiKey } = body as {
  modelId?: string;
  messages?: any[];
  userKey?: string;
  userApiKey?: string;
};

const keyFromClient = (userKey ?? userApiKey ?? "").trim();
const hasUserKey = keyFromClient.length > 0;

// ✅ userKey থাকলে OpenRouter, না থাকলে Groq (admin)
const apiUrl = hasUserKey ? OPENROUTER_URL : GROQ_URL;
const apiKey = hasUserKey ? keyFromClient : process.env.GROQ_API_KEY;

if (!apiKey) {
  return res.status(400).json({
    error: hasUserKey
      ? "Missing API key (userKey)"
      : "Missing API key (GROQ_API_KEY)",
  });
}

// ✅ userKey থাকলে সবসময় Gemini 2.5 Flash
const finalModelId = hasUserKey ? "google/gemini-2.5-flash" : (modelId || "qwen/qwen3-32b");
if (!Array.isArray(messages)) {
  return res.status(400).json({ error: "messages are required" });
}

if (!hasUserKey && !modelId) {
  return res.status(400).json({ error: "modelId is required" });
}
//  আপাতত: userKey থাকলে সবসময় Gemini 2.5 Flash
const finalModelId = hasUserKey
  

const r = await fetch(apiUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    model: finalModelId,
    messages,
    temperature: 0.7,
    max_tokens: 1536,
  }),
});

const data = await r.json();
if (!r.ok) {
  return res.status(r.status).json({
    error: data?.error?.message || data?.error || data?.message || "API Error",
    data,
  });
}

const raw = data?.choices?.[0]?.message?.content ?? "";

const text = raw
  .replace(/<think>[\s\S]*?<\/think>/gi, "")
  .replace(/^\s*<think>[\s\S]*$/gi, "")
  .trim();

return res.status(200).json({ text });
    
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Server error" });
  }
      }
