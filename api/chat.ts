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

    const { modelId, messages, userKey, userApiKey, prompt, mode } = body as {
  modelId?: string;
  messages?: any[];
  userKey?: string;
  userApiKey?: string;
  prompt?: string;
  mode?: "chat" | "image";
};

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "messages are required" });
    }

    const keyFromClient = (userKey ?? userApiKey ?? "").trim();
    const hasUserKey = keyFromClient.length > 0;
if (mode === "image") {
  const imagePrompt = (prompt || "").trim();

  if (hasUserKey) {
    return res.status(403).json({
      error: "Image generation is available only in admin mode",
    });
  }

  if (!imagePrompt) {
    return res.status(400).json({ error: "prompt is required" });
  }

  const geminiApiKey = process.env.GEMINI_API_KEY || "";

  if (!geminiApiKey) {
    return res.status(400).json({
      error: "Missing API key (GEMINI_API_KEY)",
    });
  }

  return res.status(501).json({
    error: "Image mode is not connected yet",
  });
    }
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
    "You are a meticulous problem solver. For math, science, coding, and logic tasks: restate briefly, plan steps, solve carefully, and always give a clear final answer in normal text. For math answers, use simple normal language and write math in ordinary school-style notation such as x^2, 1/x, (a+b), sqrt(x), >=, <=. Do not use raw LaTeX commands like \\frac, \\sqrt, \\ge, \\[, or unusual symbolic notation.",
};

const finalMessages =
  finalModelId === "openai/gpt-oss-120b"
    ? [ossSystem, ...messages]
    : messages;
    const requestBody: Record<string, any> = {
  model: finalModelId,
  messages: finalMessages,
  temperature: 0.7,
};

if (finalModelId === "openai/gpt-oss-120b") {
  requestBody.max_completion_tokens = 4096;
  requestBody.reasoning_effort = "high";
} else {
  requestBody.max_tokens = 2048;
}

const upstream = await fetch(apiUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify(requestBody),
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

const msg0 = data?.choices?.[0]?.message;
const content0 = msg0?.content;

let raw = "";

if (typeof content0 === "string") {
  raw = content0;
} else if (Array.isArray(content0)) {
  raw = content0
    .map((p: any) =>
      typeof p === "string"
        ? p
        : typeof p?.text === "string"
        ? p.text
        : typeof p?.content === "string"
        ? p.content
        : ""
    )
    .join("");
}

if (!raw && typeof msg0?.reasoning === "string") {
  raw = msg0.reasoning;
}

if (!raw && typeof data?.choices?.[0]?.text === "string") {
  raw = data.choices[0].text;
}

if (!raw && typeof data?.output_text === "string") {
  raw = data.output_text;
}

const cleaned =
  raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim() ||
  raw.trim() ||
  "⚠️ Empty response from model";

return res.status(200).json({
  text: `${debugPrefix}\n${cleaned}`,
});         
