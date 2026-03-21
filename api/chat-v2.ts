import type { VercelRequest, VercelResponse } from "@vercel/node";
import oldChatHandler from "./chat";
import { runControllerV2Engine } from "../src/services/controllerV2Engine";

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

const getLastUserText = (messages: any[]): string => {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    if (msg?.role !== "user") continue;

    if (typeof msg?.content === "string") {
      return msg.content.trim();
    }

    if (Array.isArray(msg?.content)) {
      const joined = msg.content
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

      if (joined) return joined;
    }
  }

  return "";
};

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
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
      mode ?? (Array.isArray(messages) ? "chat" : undefined);

    if (effectiveMode !== "chat" || !Array.isArray(messages)) {
      return oldChatHandler(req, res);
    }

    const controllerApiKey = (
      userKey ??
      userApiKey ??
      process.env.GROQ_API_KEY ??
      ""
    ).trim();

    if (!controllerApiKey) {
      return oldChatHandler(req, res);
    }

    const resolvedPrompt =
      typeof prompt === "string" && prompt.trim()
        ? prompt.trim()
        : getLastUserText(messages);

    const controllerResult = await runControllerV2Engine({
      apiKey: controllerApiKey,
      prompt: resolvedPrompt,
      messages,
      systemInstruction:
        typeof systemInstruction === "string" ? systemInstruction : "",
      hasImage: Boolean(imageBase64),
      imageContext: "",
      imageBase64: typeof imageBase64 === "string" ? imageBase64 : "",
      mimeType: typeof mimeType === "string" ? mimeType : "",
    });

    if (!controllerResult.ok || !controllerResult.finalText.trim()) {
      console.error("chat-v2 engine fallback", controllerResult.reason);
      return oldChatHandler(req, res);
    }

    return res.status(200).json({
      text: controllerResult.finalText.trim(),
      modelId: "controller-v2",
      meta: {
        plan: controllerResult.plan,
        hasImageContext: Boolean(controllerResult.imageContext),
        usedReasoning: Boolean(controllerResult.reasoningOutput),
        usedWeb: Boolean(controllerResult.webOutput),
        usedFast: Boolean(controllerResult.fastOutput),
        usedRefine: Boolean(controllerResult.refinedOutput),
      },
    });
  } catch (error) {
    console.error("chat-v2 route fallback", error);
    return oldChatHandler(req, res);
  }
}
