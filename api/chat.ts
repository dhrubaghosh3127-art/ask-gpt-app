// /api/chat.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : (req.body ?? {});

    const { modelId, messages, userKey, userApiKey } = body as {
      modelId?: string;
      messages?: any[];
      userKey?: string;
      userApiKey?: string;
    };

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "messages are required" });
    }

    const keyFromClient = (userKey ?? userApiKey ?? "").trim();
    const hasUserKey = keyFromClient.length > 0;

    // userKey থাকলে OpenRouter, না থাকলে Groq(admin)
    const apiUrl = hasUserKey ? OPENROUTER_URL : GROQ_URL;
    const apiKey = hasUserKey ? keyFromClient : (process.env.GROQ_API_KEY || "");

    if (!apiKey) {
      return res.status(400).json({
        error: hasUserKey
          ? "Missing API key (userKey)"
          : "Missing API key (GROQ_API_KEY)",
      });
    }

    if (!hasUserKey && !modelId) {
      return res.status(400).json({ error: "modelId is required" });
    }

    const finalModelId =
  hasUserKey
    ? (modelId || "google/gemini-2.5-flash")
    : (modelId || "llama-3.3-70b-versatile");
const ossSystem = {
  role: "system",
  content:
    "You are a meticulous problem solver. For math/science/coding/logic: restate briefly, plan steps, solve carefully, and give a clear final answer."
};

const finalMessages =
  finalModelId === "openai/gpt-oss-120b"
    ? [ossSystem, ...messages]
    : messages;
    const upstream = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: finalModelId,
        messages: finalMessages,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    const rawBody = await upstream.text();

    let data: any = null;
    try {
      data = rawBody ? JSON.parse(rawBody) : null;
    } catch {
      data = null;
    }

    if (!upstream.ok) {
      const msg =
        data?.error?.message ||
        data?.error ||
        data?.message ||
        rawBody?.slice(0, 250) ||
        "API Error";

      return res.status(upstream.status).json({ error: msg, data });
    }

    if (!data) {
      return res.status(502).json({
        error: rawBody?.slice(0, 250) || "Invalid response from provider",
      });
    }

    const provider = hasUserKey ? "openrouter" : "groq";
const debugPrefix = `[${provider} | ${finalModelId}]`;

const raw = data?.choices?.[0]?.message?.content ?? "";
const text = (debugPrefix + "\n" + raw)
  .replace(/<think>[\s\S]*?<\/think>/gi, "")
  .replace(/^\s*<think>[\s\S]*$/gi, "")
  .trim();

return res.status(200).json({ text });
                        
