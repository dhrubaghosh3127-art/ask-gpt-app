// /api/chat.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// ─────────────────────────────────────────────────────────────────────────────
// ELIYEN_SYSTEM_PROMPT — always included, every chat request, every model.
// Replaces: CAPABILITY_SYSTEM_PROMPT + isCapabilityQuestion() keyword gating
//           + ossSystem (now merged in, no longer conditional on model).
// Eliyen always knows its own identity and capabilities — no detection needed,
// exactly like Claude/ChatGPT never need a keyword check to know themselves.
// ─────────────────────────────────────────────────────────────────────────────
const ELIYEN_SYSTEM_PROMPT = `
You are Eliyen, an AI assistant built by PROHOR AI.

You always know your own capabilities — you never have to guess, hedge, or say
"I can't do that" just because you personally don't perform a step directly,
if the app around you supports it. Inside this app you can:
- Hold normal conversations, help with writing, coding, math, study, translation, and social media content.
- Search the web yourself when a question needs live, current, or recent information — you decide this on your own, quietly, using your judgement about whether your own knowledge is enough or not.
- Analyze photos the user sends you.
- Create images when asked to generate, draw, or design something.
- Transcribe voice input.

How you think and answer:
- Understand what the user actually wants before responding. Simple questions get short, direct answers. Complex tasks (math, coding, logic, multi-step reasoning) get careful step-by-step thinking before you give a clear final answer.
- If a question depends on current/live/recent facts (news, prices, scores, weather, "today", anything that could have changed recently or is after your training), use your web search ability to check first rather than guessing from memory.
- Write math in plain, ordinary notation people can read normally: x^2, 1/x, sqrt(x), (a+b), >=, <=. Never output raw LaTeX commands like \\frac, \\sqrt{}, \\ge, or \\[ ... \\].
- Never mention internal model names, backend routing, or tool implementation details unless the user explicitly asks how the app works technically.
- Be warm, direct, and genuinely helpful — like a sharp, knowledgeable friend, not a corporate script.
`.trim();

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
      stream,
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
      stream?: boolean;
    };

    if (mode === "chat" && !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages are required" });
    }

    const keyFromClient = (userKey ?? userApiKey ?? "").trim();
    const hasUserKey = keyFromClient.length > 0;

    // ═══════════════════════════════════════════════════════════════════════
    // IMAGE GENERATION MODE — unchanged
    // ═══════════════════════════════════════════════════════════════════════
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
            instances: [{ prompt: imagePrompt }],
            parameters: { sampleCount: 1 },
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

    // ═══════════════════════════════════════════════════════════════════════
    // VISION MODE — unchanged
    // ═══════════════════════════════════════════════════════════════════════
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
        return res.status(400).json({ error: "imageBase64 is required" });
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

    // ═══════════════════════════════════════════════════════════════════════
    // TRANSCRIBE MODE — unchanged
    // ═══════════════════════════════════════════════════════════════════════
    if (mode === "transcribe") {
      if (hasUserKey) {
        return res.status(403).json({
          error: "Voice transcription is available only in admin mode",
        });
      }

      const groqApiKey = process.env.GROQ_API_KEY || "";

      if (!groqApiKey) {
        return res.status(400).json({ error: "Missing API key (GROQ_API_KEY)" });
      }

      const cleanBase64 = (audioBase64 || "")
        .replace(/^data:.*;base64,/, "")
        .trim();

      if (!cleanBase64) {
        return res.status(400).json({ error: "audioBase64 is required" });
      }

      const actualMimeType = (mimeType || "audio/webm").trim() || "audio/webm";
      const audioBuffer = Buffer.from(cleanBase64, "base64");
      const audioBlob = new Blob([audioBuffer], { type: actualMimeType });

      const ext = actualMimeType.includes("wav")
        ? "wav"
        : actualMimeType.includes("ogg")
        ? "ogg"
        : actualMimeType.includes("mp4")
        ? "mp4"
        : actualMimeType.includes("mpeg") || actualMimeType.includes("mp3")
        ? "mp3"
        : "webm";

      const formData = new FormData();
      formData.append("model", "whisper-large-v3-turbo");
      formData.append("file", audioBlob, `voice.${ext}`);
      formData.append("response_format", "json");

      if (language && language.trim()) {
        formData.append("language", language.trim());
      }

      const sttRes = await fetch(
        "https://api.groq.com/openai/v1/audio/transcriptions",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${groqApiKey}` },
          body: formData,
        }
      );

      const sttRaw = await sttRes.text();
      let sttData: any = null;
      try {
        sttData = sttRaw ? JSON.parse(sttRaw) : null;
      } catch {
        sttData = { text: sttRaw };
      }

      if (!sttRes.ok) {
        return res.status(sttRes.status).json({
          error: sttData?.error?.message || sttData?.error || "Transcription failed",
          data: sttData,
        });
      }

      const text = typeof sttData?.text === "string" ? sttData.text.trim() : "";

      return res.status(200).json({ text, modelId: "whisper-large-v3-turbo" });
    }

    // ═══════════════════════════════════════════════════════════════════════
    // CHAT MODE — the smart, single-model, tool-aware path
    // ═══════════════════════════════════════════════════════════════════════

    const apiUrl = GROQ_URL;
    const apiKey = hasUserKey ? keyFromClient : (process.env.GROQ_API_KEY || "");

    if (!apiKey) {
      return res.status(400).json({
        error: hasUserKey
          ? "Missing API key (userKey)"
          : "Missing API key (GROQ_API_KEY)",
      });
    }

    // ✅ Single smart default for EVERYONE — admin mode and BYOK (user's own key)
    // go through the exact same model + same tool access. No word/keyword
    // based routing decides this anymore; the model itself decides what it
    // needs (web search or not) via native tool calling.
    const finalModelId = modelId && modelId !== "auto" ? modelId : "openai/gpt-oss-120b";

    const customSystem =
      typeof systemInstruction === "string" && systemInstruction.trim()
        ? { role: "system", content: systemInstruction.trim() }
        : null;

    // Identity + capability prompt is ALWAYS present — no keyword detection.
    const identitySystem = { role: "system", content: ELIYEN_SYSTEM_PROMPT };

    const finalMessages = [
      identitySystem,
      ...(customSystem ? [customSystem] : []),
      ...messages,
    ];

    const requestBody: Record<string, any> = {
      model: finalModelId,
      messages: finalMessages,
      temperature: 0.7,
      stream: Boolean(stream),
    };

    if (finalModelId === "openai/gpt-oss-120b") {
      requestBody.max_completion_tokens = 4096;
      requestBody.reasoning_effort = "high";
      // ✅ Groq's built-in browser_search tool for GPT-OSS models.
      // The model decides on its own — per message — whether it needs to
      // search the web. Groq executes the search server-side and returns
      // the grounded final answer. No manual tool-call loop needed here.
      requestBody.tools = [{ type: "browser_search" }];
    } else if (finalModelId === "qwen/qwen3-32b" || finalModelId === "qwen/qwen3.6-27b") {
      requestBody.max_tokens = 4096;
      requestBody.reasoning_effort = "default";
      requestBody.reasoning_format = "hidden";
    } else if (finalModelId === "groq/compound") {
      // groq/compound is already a fully agentic system with its own
      // always-on web search — no extra tools param needed or supported here.
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

    // ── Streaming path ──────────────────────────────────────────────────────
    if (mode === "chat" && stream) {
      if (!upstream.ok || !upstream.body) {
        const streamErrText = await upstream.text();
        let streamErrData: any = null;
        try {
          streamErrData = streamErrText ? JSON.parse(streamErrText) : null;
        } catch {
          streamErrData = null;
        }

        const streamMsg =
          streamErrData?.error?.message ||
          streamErrData?.error ||
          streamErrData?.message ||
          streamErrText.slice(0, 250) ||
          "API Error";

        return res.status(upstream.status).json({ error: streamMsg, data: streamErrData });
      }

      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");

      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(decoder.decode(value, { stream: true }));
        }
        res.end();
        return;
      } catch {
        res.end();
        return;
      }
    }

    // ── Non-streaming path ──────────────────────────────────────────────────
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

    // ✅ No more "[groq | modelId]" debug prefix leaking to users.
    return res.status(200).json({ text: cleaned });
  } catch (err: any) {
    return res.status(500).json({
      error: err?.message || "Internal server error",
    });
  }
                                 }
      
