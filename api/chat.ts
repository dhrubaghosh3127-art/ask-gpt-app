// /api/chat.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const CAPABILITY_SYSTEM_PROMPT = `
You are ASK-GPT inside an app with multiple built-in capabilities.

Rules:
- First understand whether the user is asking about capability/ability, or actually asking you to perform the task now.
- If the user is only asking whether the app can do something, reply naturally, confidently, and briefly based on the app's real features.
- Do not say you cannot do something just because the current text model alone does not directly perform it, if the app supports that feature in its flow.
- The app can support normal chat, coding help, math help, web-assisted answers, image creation, image analysis, and voice-to-text input.
- If the user is actually asking you to do the task now, then respond normally and helpfully.
- Never mention internal routing, hidden models, or backend/tool details unless the user explicitly asks.
`;

const extractTextFromContent = (content: any): string => {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part: any) =>
        typeof part === "string"
          ? part
          : typeof part?.text === "string"
          ? part.text
          : ""
      )
      .join(" ")
      .trim();
  }
  return "";
};

const getLastUserText = (messages: any[]): string => {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i]?.role === "user") {
      return extractTextFromContent(messages[i]?.content).trim();
    }
  }
  return "";
};

const isCapabilityQuestion = (text: string): boolean => {
  const q = text.trim();
  if (!q) return false;

  const capabilityPattern =
    /(can you|do you|are you able to|are you capable of|support|possible|পারো|পারবা|করতে পারো|করতে পারবা|korte paro|parbe)/i;

  const directActionPattern =
    /^(create|generate|make|draw|solve|analyze|analyse|search|find|write|code|build|show|tell|summarize|translate|বানাও|তৈরি করো|solve করো|analysis করো|search করো|লিখে দাও|দেখাও|একটা|একটি)/i;

  return capabilityPattern.test(q) && !directActionPattern.test(q);
};
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

    const {
  modelId,
  messages,
  userKey,
  userApiKey,
  prompt,
  mode,
  audioBase64,
  imageBase64,
  mimeType,
  language,
} = body as {
  modelId?: string;
  messages?: any[];
  userKey?: string;
  userApiKey?: string;
  prompt?: string;
  mode?: "chat" | "image" | "transcribe" | "vision";
  audioBase64?: string;
  imageBase64?: string;
  mimeType?: string;
  language?: string;
};

    if (mode === "chat" && !Array.isArray(messages)) {
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

const actualImageModel =
  modelId === "imagen-4-fast-generate"
    ? "imagen-4.0-fast-generate-001"
    : modelId === "imagen-4-ultra-generate"
    ? "imagen-4.0-ultra-generate-001"
    : "imagen-4.0-generate-001";

const imageRes = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/${actualImageModel}:predict`,
  {
    method: "POST",
    headers: {
      "x-goog-api-key": geminiApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      instances: [
        {
          prompt: imagePrompt,
        },
      ],
      parameters: {
        sampleCount: 1,
      },
    }),
  }
);

const imageData = await imageRes.json().catch(() => null);

if (!imageRes.ok) {
  return res.status(imageRes.status).json({
    error:
      imageData?.error?.message ||
      imageData?.error ||
      "Image generation failed",
    data: imageData,
  });
}

const imageBytes =
  imageData?.predictions?.[0]?.bytesBase64Encoded ||
  imageData?.predictions?.[0]?.image?.bytesBase64Encoded ||
  imageData?.generatedImages?.[0]?.image?.imageBytes ||
  "";

if (!imageBytes) {
  return res.status(502).json({
    error: "No image bytes returned from Gemini",
    data: imageData,
  });
}

return res.status(200).json({
  imageUrl: `data:image/png;base64,${imageBytes}`,
  modelId: actualImageModel,
});
    }
    if (mode === "vision") {
  if (hasUserKey) {
    return res.status(403).json({
      error: "Image analysis is available only in admin mode",
    });
  }

  const groqApiKey = process.env.GROQ_API_KEY || "";

  if (!groqApiKey) {
    return res.status(400).json({
      error: "Missing API key (GROQ_API_KEY)",
    });
  }

  const cleanImageBase64 = (imageBase64 || "")
    .replace(/^data:.*;base64,/, "")
    .trim();

  if (!cleanImageBase64) {
    return res.status(400).json({
      error: "imageBase64 is required",
    });
  }

  const actualMimeType = (mimeType || "image/jpeg").trim() || "image/jpeg";
  const imageUrl = `data:${actualMimeType};base64,${cleanImageBase64}`;

  const visionPrompt =
    (prompt || "").trim() ||
    "Read the image carefully and return only the main text, question, or useful visible content from the image. Do not solve it unless the image itself asks for a direct answer.";

  const visionRes = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${groqApiKey}`,
    },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content:
            "You only analyze the image and extract the useful visible text, question, or content. Keep it clean and concise. Do not add extra explanation unless necessary.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: visionPrompt },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
    }),
  });

  const visionRaw = await visionRes.text();

  let visionData: any = null;
  try {
    visionData = visionRaw ? JSON.parse(visionRaw) : null;
  } catch {
    visionData = null;
  }

  if (!visionRes.ok) {
    return res.status(visionRes.status).json({
      error:
        visionData?.error?.message ||
        visionData?.error ||
        visionData?.message ||
        visionRaw.slice(0, 250) ||
        "Image analysis failed",
      data: visionData,
    });
  }

  const visionMsg = visionData?.choices?.[0]?.message;
  const visionContent = visionMsg?.content;

  let extracted = "";

  if (typeof visionContent === "string") {
    extracted = visionContent;
  } else if (Array.isArray(visionContent)) {
    extracted = visionContent
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

  extracted = extracted.trim();

  return res.status(200).json({
    text: extracted,
    modelId: "meta-llama/llama-4-scout-17b-16e-instruct",
  });
    }
    if (mode === "transcribe") {
  if (hasUserKey) {
    return res.status(403).json({
      error: "Voice transcription is available only in admin mode",
    });
  }

  const groqApiKey = process.env.GROQ_API_KEY || "";

  if (!groqApiKey) {
    return res.status(400).json({
      error: "Missing API key (GROQ_API_KEY)",
    });
  }

  const cleanBase64 = (audioBase64 || "")
    .replace(/^data:.*;base64,/, "")
    .trim();

  if (!cleanBase64) {
    return res.status(400).json({
      error: "audioBase64 is required",
    });
  }

  const actualMimeType = (mimeType || "audio/webm").trim() || "audio/webm";
const audioBuffer = Buffer.from(cleanBase64, "base64");
const audioBlob = new Blob([audioBuffer], { type: actualMimeType });

const ext =
  actualMimeType.includes("wav") ? "wav" :
  actualMimeType.includes("ogg") ? "ogg" :
  actualMimeType.includes("mp4") ? "mp4" :
  actualMimeType.includes("mpeg") || actualMimeType.includes("mp3") ? "mp3" :
  "webm";

const formData = new FormData();
formData.append("model", "whisper-large-v3-turbo");
formData.append("file", audioBlob, `voice.${ext}`);
formData.append("response_format", "json");

if (language && language.trim()) {
  formData.append("language", language.trim());
}

const sttRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${groqApiKey}`,
  },
  body: formData,
});

  const sttRaw = await sttRes.text();

  let sttData: any = null;
  try {
    sttData = sttRaw ? JSON.parse(sttRaw) : null;
  } catch {
    sttData = { text: sttRaw };
  }

  if (!sttRes.ok) {
    return res.status(sttRes.status).json({
      error:
        sttData?.error?.message ||
        sttData?.error ||
        "Transcription failed",
      data: sttData,
    });
  }

  const text =
    typeof sttData?.text === "string"
      ? sttData.text.trim()
      : "";

  return res.status(200).json({
    text,
    modelId: "whisper-large-v3-turbo",
  });
                              }
    // userKey থাকলে OpenRouter, না থাকলে Groq(admin)
    const apiUrl = GROQ_URL;
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

const lastUserText = getLastUserText(messages);
const capabilityMode = isCapabilityQuestion(lastUserText);
const capabilitySystem = {
  role: "system",
  content: CAPABILITY_SYSTEM_PROMPT,
};

const finalMessages =
  capabilityMode
    ? [
        capabilitySystem,
        ...(finalModelId === "openai/gpt-oss-120b" ? [ossSystem] : []),
        ...messages,
      ]
    : finalModelId === "openai/gpt-oss-120b"
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
} else if (finalModelId === "groq/compound") {
  // no app-side max token cap for groq compound
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
