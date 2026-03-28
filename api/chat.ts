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

type RoutePlan = {
  route: "normal" | "web";
  capabilityMode: boolean;
};

const DEFAULT_ROUTE_PLAN: RoutePlan = {
  route: "normal",
  capabilityMode: false,
};

const ROUTE_PLANNER_PROMPT = `You are a routing planner.

Read the user's real intent from the latest message and short recent context.
Do NOT use keyword-only matching.
Infer from actual meaning.

Return ONLY minified JSON in this exact format:
{"route":"normal","capabilityMode":false}

Rules:
- route="web" only when the user clearly needs current/external web information.
- route="normal" for normal chat, casual talk, help, feelings, explanations, rewrites, translations, stories, brainstorming, and general conversation.
- capabilityMode=true only when the user is actually asking what the assistant/app can do, whether a feature is supported, or whether something is available.
- capabilityMode=false otherwise.`;

const parseRoutePlan = (raw: string): RoutePlan => {
  const source = (raw || "").trim();

  const normalize = (parsed: any): RoutePlan => ({
    route: parsed?.route === "web" ? "web" : "normal",
    capabilityMode: Boolean(parsed?.capabilityMode),
  });

  const tryParse = (value: string): RoutePlan | null => {
    try {
      return normalize(JSON.parse(value || "{}"));
    } catch {
      return null;
    }
  };

  const directParsed = tryParse(source);
  if (directParsed) return directParsed;

  const fencedMatch = source.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    const fencedParsed = tryParse(fencedMatch[1]);
    if (fencedParsed) return fencedParsed;
  }

  const jsonMatch = source.match(/\{[\s\S]*\}/);
  if (jsonMatch?.[0]) {
    const looseParsed = tryParse(jsonMatch[0]);
    if (looseParsed) return looseParsed;
  }

  return DEFAULT_ROUTE_PLAN;
};

const buildRoutePlannerMessages = (
  messages: any[],
  systemInstruction?: string
) => {
  const lastUserText = getLastUserText(messages);

  const recentHistory = (messages || [])
    .slice(-8)
    .map((m: any, i: number) => {
      const role =
        m?.role === "assistant" || m?.role === "model"
          ? "assistant"
          : m?.role === "system"
          ? "system"
          : "user";

      return `${i + 1}. ${role}: ${extractTextFromContent(m?.content || "")}`;
    })
    .filter(Boolean)
    .join("\n");

  return [
    ...(systemInstruction?.trim()
      ? [
          {
            role: "system",
            content: systemInstruction.trim(),
          },
        ]
      : []),
    {
      role: "system",
      content: ROUTE_PLANNER_PROMPT,
    },
    {
      role: "user",
      content: [
        `Latest user message:\n${lastUserText}`,
        recentHistory ? `Recent chat history:\n${recentHistory}` : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
  ];
};

const runRoutePlanner = async (
  apiKey: string,
  messages: any[],
  systemInstruction?: string
): Promise<RoutePlan> => {
  try {
    const plannerRes = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: buildRoutePlannerMessages(messages, systemInstruction),
        temperature: 0,
        max_completion_tokens: 120,
        reasoning_effort: "high",
      }),
    });

    const plannerRaw = await plannerRes.text();

    if (!plannerRes.ok) {
      return DEFAULT_ROUTE_PLAN;
    }

    let plannerData: any = null;
    try {
      plannerData = plannerRaw ? JSON.parse(plannerRaw) : null;
    } catch {
      plannerData = null;
    }

    const plannerMsg = plannerData?.choices?.[0]?.message;
    const plannerContent = plannerMsg?.content;

    let raw = "";

    if (typeof plannerContent === "string") {
      raw = plannerContent;
    } else if (Array.isArray(plannerContent)) {
      raw = plannerContent
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
    } else if (typeof plannerData?.choices?.[0]?.text === "string") {
      raw = plannerData.choices[0].text;
    } else if (typeof plannerData?.output_text === "string") {
      raw = plannerData.output_text;
    }

    return parseRoutePlan(raw);
  } catch {
    return DEFAULT_ROUTE_PLAN;
  }
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
  systemInstruction,
  mode,
  audioBase64,
  imageBase64,
  mimeType,
  language,
  voiceIntelligence,
  advancedTranscribe,
} = body as {
  modelId?: string;
  messages?: any[];
  userKey?: string;
  userApiKey?: string;
  prompt?: string;
  systemInstruction?: string;
  mode?: "chat" | "image" | "transcribe" | "vision";
  audioBase64?: string;
  imageBase64?: string;
  mimeType?: string;
  language?: string;
  voiceIntelligence?: "standard" | "advanced";
  advancedTranscribe?: boolean;
};

if (mode === "chat" && !Array.isArray(messages)) {
  return res.status(400).json({ error: "messages are required" });
}

  const USE_CONTROLLER_V2 = false;

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

    const routePlan = await runRoutePlanner(apiKey, messages, systemInstruction);

const finalModelId =
  routePlan.route === "web"
    ? "groq/compound"
    : routePlan.route === "hard"
      ? "openai/gpt-oss-120b"
      : modelId || "llama-3.3-70b-versatile";

const ossSystem = {
  role: "system",
  content:
    "You are a meticulous problem solver. For math, science, coding, and logic tasks: restate briefly, plan steps, solve carefully, and keep reasoning concise but correct.",
};

const capabilityMode = routePlan.capabilityMode;
const capabilitySystem = {
  role: "system",
  content: CAPABILITY_SYSTEM_PROMPT,
};

const customSystem =
  typeof systemInstruction === "string" && systemInstruction.trim()
    ? {
        role: "system",
        content: systemInstruction.trim(),
      }
    : null;

const useThinkingSystem =
  finalModelId === "openai/gpt-oss-120b" ||
  finalModelId === "qwen/qwen3-32b";

const finalMessages = capabilityMode
  ? [
      ...(customSystem ? [customSystem] : []),
      capabilitySystem,
      ...(useThinkingSystem ? [ossSystem] : []),
      ...messages,
    ]
  : [
      ...(customSystem ? [customSystem] : []),
      ...(useThinkingSystem ? [ossSystem] : []),
      ...messages,
    ];
    const requestBody: Record<string, any> = {
  model: finalModelId,
  messages: finalMessages,
  temperature: 0.7,
};

if (finalModelId === "openai/gpt-oss-120b") {
  requestBody.max_completion_tokens = 4096;
  requestBody.reasoning_effort = "high";
} else if (finalModelId === "qwen/qwen3-32b") {
  requestBody.max_tokens = 4096;
  requestBody.reasoning_effort = "default";
  requestBody.reasoning_format = "hidden";
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

    const provider = "groq";
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
