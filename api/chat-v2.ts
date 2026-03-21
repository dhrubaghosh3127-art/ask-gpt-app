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
const smoke: Record<string, boolean> = {};

try {
  await import("./_lib/controllerV2.js");
  smoke.controllerV2 = true;
} catch (error) {
  return res.status(500).json({
    error: `smoke_controllerV2_failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  });
}

try {
  await import("./_lib/controllerV2Image.js");
  smoke.controllerV2Image = true;
} catch (error) {
  return res.status(500).json({
    error: `smoke_controllerV2Image_failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  });
}

try {
  await import("./_lib/controllerV2Api.js");
  smoke.controllerV2Api = true;
} catch (error) {
  return res.status(500).json({
    error: `smoke_controllerV2Api_failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  });
}

try {
  await import("./_lib/controllerV2Runtime.js");
  smoke.controllerV2Runtime = true;
} catch (error) {
  return res.status(500).json({
    error: `smoke_controllerV2Runtime_failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  });
}

try {
  await import("./_lib/controllerV2Planner.js");
  smoke.controllerV2Planner = true;
} catch (error) {
  return res.status(500).json({
    error: `smoke_controllerV2Planner_failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  });
}

try {
  await import("./_lib/controllerV2Helpers.js");
  smoke.controllerV2Helpers = true;
} catch (error) {
  return res.status(500).json({
    error: `smoke_controllerV2Helpers_failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  });
}

try {
  await import("./_lib/controllerV2Finalize.js");
  smoke.controllerV2Finalize = true;
} catch (error) {
  return res.status(500).json({
    error: `smoke_controllerV2Finalize_failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  });
}

try {
  await import("./_lib/controllerV2Engine.js");
  smoke.controllerV2Engine = true;
} catch (error) {
  return res.status(500).json({
    error: `smoke_controllerV2Engine_failed: ${
      error instanceof Error ? error.message : String(error)
    }`,
  });
}

return res.status(200).json({
  text: "[chat-v2] smoke ok",
  modelId: "chat-v2-smoke",
  smoke,
});
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
      return oldChatHandler(req, res);
    }

    if (!Array.isArray(messages)) {
      return oldChatHandler(req, res);
    }

    const apiKey = (
      userKey ??
      userApiKey ??
      process.env.GROQ_API_KEY ??
      ""
    ).trim();

    if (!apiKey) {
      return oldChatHandler(req, res);
    }

    const resolvedPrompt =
      typeof prompt === "string" && prompt.trim()
        ? prompt.trim()
        : getLastUserText(messages);

    const controllerResult = await runControllerV2Engine({
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

    if (controllerResult?.ok && controllerResult?.finalText?.trim()) {
      return res.status(200).json({
        text: controllerResult.finalText.trim(),
        modelId: "controller-v2",
        meta: {
          plan: controllerResult.plan ?? null,
          hasImageContext: Boolean(controllerResult.imageContext),
          usedReasoning: Boolean(controllerResult.reasoningOutput),
          usedWeb: Boolean(controllerResult.webOutput),
          usedFast: Boolean(controllerResult.fastOutput),
          usedRefine: Boolean(controllerResult.refinedOutput),
        },
      });
    }

    console.error("chat-v2 fallback: controller failed", controllerResult);
    return oldChatHandler(req, res);
  } catch (error) {
    console.error("chat-v2 fallback: route crashed", error);
    return oldChatHandler(req, res);
  }
}
