// /api/chat.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function extractTextFromAny(data: any): string {
  const msg0 = data?.choices?.[0]?.message;
  const content0 = msg0?.content;

  // 1) Standard string content
  if (typeof content0 === "string") {
    return content0;
  }

  // 2) Array content
  if (Array.isArray(content0)) {
    const joined = content0
      .map((p: any) => {
        if (typeof p === "string") return p;
        if (typeof p?.text === "string") return p.text;
        if (typeof p?.content === "string") return p.content;
        return "";
      })
      .join("")
      .trim();

    if (joined) return joined;
  }

  // 3) Some providers return .text
  if (typeof data?.choices?.[0]?.text === "string") {
    return data.choices[0].text;
  }

  // 4) Some providers return output_text
  if (typeof data?.output_text === "string") {
    return data.output_text;
  }

  // 5) Some providers return output array
  if (Array.isArray(data?.output)) {
    const joined = data.output
      .map((item: any) => {
        if (typeof item?.text === "string") return item.text;
        if (typeof item?.content?.[0]?.text === "string") return item.content[0].text;
        return "";
      })
      .join("")
      .trim();

    if (joined) return joined;
  }

  return "";
}

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
    const apiKey = hasUserKey
      ? keyFromClient
      : (process.env.GROQ_API_KEY || "");

    if (!apiKey) {
      return res.status(400).json({
        error: hasUserKey
          ? "Missing API key (userKey)"
          : "Missing API key (GROQ_API_KEY)",
      });
    }

    if (!modelId) {
      return res.status(400).json({ error: "modelId is required" });
    }

    // user key system unchanged
    // admin default fallback llama
    const finalModelId = hasUserKey
      ? (modelId || "google/gemini-2.5-flash")
      : (modelId || "llama-3.3-70b-versatile");

    const ossSystem = {
      role: "system",
      content:
        "You are a meticulous problem solver. For math/science/coding/logic: restate briefly, plan steps, solve carefully, check the result, and always give a clear FINAL answer in normal text. Do not put the final answer inside <think> tags.",
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
        rawBody?.slice(0, 400) ||
        "API Error";

      return res.status(upstream.status).json({ error: msg, data });
    }

    if (!data) {
      return res.status(502).json({
        error: rawBody?.slice(0, 400) || "Invalid response from provider",
      });
    }

    const provider = hasUserKey ? "openrouter" : "groq";
    const debugPrefix = `[${provider} | ${finalModelId}]`;

    const raw = extractTextFromAny(data);

    let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

    // think কাটার পর খালি হলে raw fallback
    if (!cleaned) {
      cleaned = raw.trim();
    }

    if (!cleaned) {
      cleaned = "⚠️ Empty response from model";
    }

    return res.status(200).json({
      text: `${debugPrefix}\n${cleaned}`,
    });
  } catch (err: any) {
    return res.status(500).json({
      error: err?.message || "Server error",
    });
  }
           }
      
