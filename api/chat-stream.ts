import type { VercelRequest, VercelResponse } from "@vercel/node";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

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

    const apiUrl = hasUserKey ? OPENROUTER_URL : GROQ_URL;
    const apiKey = hasUserKey ? keyFromClient : (process.env.GROQ_API_KEY || "");

    if (!apiKey) {
      return res.status(400).json({
        error: hasUserKey
          ? "Missing API key (userKey)"
          : "Missing API key (GROQ_API_KEY)",
      });
    }

    const finalModelId = hasUserKey
      ? (modelId || "google/gemini-2.5-flash")
      : (modelId || "llama-3.3-70b-versatile");

    const requestBody: Record<string, any> = {
      model: finalModelId,
      messages,
      temperature: 0.7,
      stream: true,
    };

    if (finalModelId === "openai/gpt-oss-120b") {
      requestBody.max_completion_tokens = 4096;
      requestBody.reasoning_effort = "high";
    } else {
      requestBody.max_completion_tokens = 2048;
    }

    const upstream = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        Accept: "text/event-stream",
      },
      body: JSON.stringify(requestBody),
    });

    if (!upstream.ok || !upstream.body) {
      const raw = await upstream.text().catch(() => "");
      return res.status(upstream.status || 500).json({
        error: raw || "Streaming request failed",
      });
    }

    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    const reader = upstream.body.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        res.write(Buffer.from(value));
      }
    }

    res.end();
  } catch (err: any) {
    return res.status(500).json({
      error: err?.message || "Server error",
    });
  }
      }
