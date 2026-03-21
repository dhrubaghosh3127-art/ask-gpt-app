import type { VercelRequest, VercelResponse } from "@vercel/node";


type ChatV2Body = {
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

const extractTextFromContent = (content: any): string => {
  if (typeof content === "string") return content.trim();

  if (Array.isArray(content)) {
    return content
      .map((part: any) =>
        typeof part === "string"
          ? part
          : typeof part?.text === "string"
            ? part.text
            : typeof part?.content === "string"
              ? part.content
              : ""
      )
      .join(" ")
      .trim();
  }

  if (typeof content?.text === "string") return content.text.trim();
  if (typeof content?.content === "string") return content.content.trim();

  return "";
};

const getLastUserText = (messages: any[]): string => {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    if (msg?.role === "user") {
      const text = extractTextFromContent(msg?.content);
      if (text) return text;
    }
  }
  return "";
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
let runControllerV2Engine: any;
try {
  const mod = await import("./_lib/controllerV2Engine.js");
  runControllerV2Engine = mod.runControllerV2Engine;
} catch (error) {
  return res.status(500).json({
    error: `controller_v2_engine_import_failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  });
}
  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : (req.body ?? {});

    const {
      messages,
      userKey,
      userApiKey,
      prompt,
      systemInstruction,
      mode,
      imageBase64,
      mimeType,
    } = body as ChatV2Body;

    const effectiveMode =
      typeof mode === "string" ? mode : Array.isArray(messages) ? "chat" : "";

    if (effectiveMode !== "chat") {
  return res.status(400).json({
    error: `chat_v2_only_supports_chat_mode: ${String(effectiveMode || "unknown")}`,
  });
    }

    if (!Array.isArray(messages)) {
  return res.status(400).json({
    error: "messages_are_required",
  });
    }

    const apiKey = (
      userKey ??
      userApiKey ??
      process.env.GROQ_API_KEY ??
      ""
    ).trim();

    if (!apiKey) {
  return res.status(400).json({
    error: "missing_api_key",
  });
    }

    const resolvedPrompt =
      typeof prompt === "string" && prompt.trim()
        ? prompt.trim()
        : getLastUserText(messages);

    let controllerResult: any = null;

try {
  controllerResult = await runControllerV2Engine({
    apiKey,
    prompt: resolvedPrompt,
    messages,
    systemInstruction:
      typeof systemInstruction === "string" ? systemInstruction : "",
    hasImage: Boolean(imageBase64),
    imageContext: "",
    imageBase64: typeof imageBase64 === "string" ? imageBase64 : "",
    mimeType: typeof mimeType === "string" ? mimeType : "",
  });
} catch (error) {
  return res.status(500).json({
    error: `controller_v2_engine_crashed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  });
}

if (
  controllerResult?.ok &&
  typeof controllerResult?.finalText === "string" &&
  controllerResult.finalText.trim()
) {
  return res.status(200).json({
    text: controllerResult.finalText.trim(),
    modelId: "controller-v2",
  });
}

return res.status(500).json({
  error: `controller_v2_failed: ${String(
    controllerResult?.reason || "empty finalText"
  )}`,
  planExists: Boolean(controllerResult?.plan),
  hasImageContext: Boolean(controllerResult?.imageContext),
  usedReasoning: Boolean(controllerResult?.reasoningOutput),
  usedWeb: Boolean(controllerResult?.webOutput),
  usedFast: Boolean(controllerResult?.fastOutput),
  usedRefine: Boolean(controllerResult?.refinedOutput),
  finalTextPreview:
    typeof controllerResult?.finalText === "string"
      ? controllerResult.finalText.slice(0, 300)
      : "",
});
  } catch (error) {
  return res.status(500).json({
    error: `chat_v2_route_crashed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  });
  }
}
