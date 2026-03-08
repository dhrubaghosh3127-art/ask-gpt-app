// /api/chat.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function extractTextFromAny(data: any): string {
  const msg0 = data?.choices?.[0]?.message;
  const content0 = msg0?.content;

  if (typeof content0 === "string") {
    return content0;
  }

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

  if (typeof data?.choices?.[0]?.text === "string") {
    return data.choices[0].text;
  }

  if (typeof data?.output_text === "string") {
    return data.output_text;
  }

  if (typeof msg0?.reasoning === "string") {
    return msg0.reasoning;
  }

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

    if (!hasUserKey && !modelId) {
      return res.status(400).json({ error: "modelId is required" });
    }

    const finalModelId = hasUserKey
      ? (modelId || "google/gemini-2.5-flash")
      : (modelId || "llama-3.3-70b-versatile");

    const ossSystem = {
  role: "system",
  content:
    "You are a meticulous problem solver. For math problems, explain in simple normal language, step by step, like ChatGPT tutoring a student. Do not use raw LaTeX, bracketed math code, or symbolic format unless absolutely necessary. Explain symbols in words when helpful, for example write what sin, cos, sqrt mean in normal language. Keep science, coding, and logic answers clear and readable, and always give a clean final answer in normal text.",
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
      requestBody.max_completion_tokens = 2048;
    } else {
      requestBody.max_tokens = 1536;
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

if (!cleaned) {
  const reasoning = data?.choices?.[0]?.message?.reasoning;
  if (typeof reasoning === "string") {
    cleaned = reasoning.trim();
  }
}

if (!cleaned) {
  const m = rawBody.match(/"reasoning":"([\s\S]*?)"/);
  if (m?.[1]) {
    cleaned = m[1]
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\")
      .replace(/\\u003c/g, "<")
      .replace(/\\u003e/g, ">")
      .trim();
  }
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
