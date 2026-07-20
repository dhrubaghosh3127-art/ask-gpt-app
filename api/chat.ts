// /api/chat.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export const config = { maxDuration: 30 };

const MISTRAL_CHAT_URL = "https://api.mistral.ai/v1/chat/completions";
const MISTRAL_CONVERSATIONS_URL = "https://api.mistral.ai/v1/conversations";
const MISTRAL_MODEL = "mistral-small-2603";

const ELIYEN_SYSTEM_PROMPT = `
You are Eliyen, an AI assistant built by PROHOR AI.

You always know your own capabilities — you never have to guess, hedge, or say
"I can't do that" just because you personally don't perform a step directly,
if the app around you supports it. Inside this app you can:
- Hold normal conversations, help with writing, coding, math, study, translation, and social media content.
- Search the web yourself when a question needs live, current, or recent information — this happens automatically through your own judgment, never by writing a tool call out as visible text.
- Read and analyze photos and PDF documents the user sends you.
- Create images when asked to generate, draw, or design something.
- Transcribe voice input.

How you answer:
- Keep answers direct and to the point. Don't pad simple questions with unnecessary explanation.
- If a question depends on current/live/recent facts (news, prices, scores, weather, "today", anything that could have changed recently or is after your training), check the web for it first rather than guessing from memory.
- You DO have real web search access. Never say "I can't browse the internet", "I don't have access to real-time data", "I can't open links", or anything similar — that is false.
- After any tool result comes back, always write your final answer yourself in plain natural language — never show raw JSON, XML, tool syntax, or code blocks of tool output to the user.
- Write math in plain, ordinary notation people can read normally: x^2, 1/x, sqrt(x), (a+b), >=, <=. Never output raw LaTeX commands like \\frac, \\sqrt{}, \\ge, or \\[ ... \\].
- Never mention internal model names, backend routing, or tool implementation details unless the user explicitly asks how the app works technically.
- Be warm, direct, and genuinely helpful — like a sharp, knowledgeable friend, not a corporate script.
`.trim();

function formatMistralError(data: any, raw: string, status: number): string {
  const m = data?.message ?? data?.error;
  if (typeof m === "string" && m.trim()) return m.trim();
  if (Array.isArray(m) && m.length) {
    return m
      .map((e: any) => {
        const loc = Array.isArray(e?.loc) ? e.loc.join(".") : "";
        const msg = typeof e?.msg === "string" ? e.msg : JSON.stringify(e);
        return loc ? `${loc}: ${msg}` : msg;
      })
      .join("; ")
      .slice(0, 500);
  }
  if (m && typeof m === "object") {
    return (typeof m.message === "string" && m.message) || JSON.stringify(m).slice(0, 500);
  }
  return raw.slice(0, 300) || `Upstream error (HTTP ${status})`;
}

function sendDelta(res: VercelResponse, delta: Record<string, any>) {
  res.write(`data: ${JSON.stringify({ choices: [{ delta, finish_reason: null }] })}\n\n`);
}

function extractChatContent(content: any): { reasoning: string; text: string } {
  if (typeof content === "string") return { reasoning: "", text: content.trim() };
  if (!Array.isArray(content)) return { reasoning: "", text: "" };

  let reasoning = "";
  let text = "";
  for (const chunk of content) {
    if (chunk?.type === "thinking") {
      const inner = Array.isArray(chunk.thinking) ? chunk.thinking : [];
      reasoning += inner.map((x: any) => (typeof x?.text === "string" ? x.text : "")).join("");
    } else if (chunk?.type === "text" && typeof chunk.text === "string") {
      text += chunk.text;
    } else if (typeof chunk?.text === "string") {
      text += chunk.text;
    }
  }
  return { reasoning: reasoning.trim(), text: text.trim() };
}

function extractConversationOutput(outputs: any[]): { reasoning: string; text: string } {
  let reasoning = "";
  let text = "";
  for (const entry of Array.isArray(outputs) ? outputs : []) {
    if (entry?.type !== "message.output") continue;
    const parsed = extractChatContent(entry.content);
    reasoning += parsed.reasoning;
    text += parsed.text;
  }
  return { reasoning: reasoning.trim(), text: text.trim() };
}

function sanitizeInputs(messages: any[] | undefined): { role: string; content: any }[] {
  return (Array.isArray(messages) ? messages : [])
    .filter((m) => m?.role === "user" || m?.role === "assistant")
    .map((m) => ({ role: m.role, content: m.content }));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body ?? {});
    const {
      modelId, messages, userKey, userApiKey, prompt, systemInstruction, mode,
      audioBase64, imageBase64, mimeType, language, stream, thinkingMode,
    } = body as {
      modelId?: string; messages?: any[]; userKey?: string; userApiKey?: string;
      prompt?: string; systemInstruction?: string;
      mode?: "chat" | "image" | "transcribe" | "vision";
      audioBase64?: string; imageBase64?: string; mimeType?: string;
      language?: string; stream?: boolean;
      thinkingMode?: boolean;
    };

    if (mode === "chat" && !Array.isArray(messages)) {
      return res.status(400).json({ error: "messages are required" });
    }

    const keyFromClient = (userKey ?? userApiKey ?? "").trim();
    const hasUserKey = keyFromClient.length > 0;

    // ─── IMAGE MODE (unchanged) ───
    if (mode === "image") {
      const imagePrompt = (prompt || "").trim();
      if (hasUserKey) return res.status(403).json({ error: "Image generation is available only in admin mode" });
      if (!imagePrompt) return res.status(400).json({ error: "prompt is required" });

      const geminiApiKey = process.env.GEMINI_API_KEY || "";
      if (!geminiApiKey) return res.status(400).json({ error: "Missing API key (GEMINI_API_KEY)" });

      const actualImageModel =
        modelId === "imagen-4-fast-generate" ? "imagen-4.0-fast-generate-001"
        : modelId === "imagen-4-ultra-generate" ? "imagen-4.0-ultra-generate-001"
        : "imagen-4.0-generate-001";

      const imageRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${actualImageModel}:predict`,
        {
          method: "POST",
          headers: { "x-goog-api-key": geminiApiKey, "Content-Type": "application/json" },
          body: JSON.stringify({ instances: [{ prompt: imagePrompt }], parameters: { sampleCount: 1 } }),
        }
      );
      const imageData = await imageRes.json().catch(() => null);
      if (!imageRes.ok) {
        return res.status(imageRes.status).json({
          error: imageData?.error?.message || imageData?.error || "Image generation failed",
        });
      }
      const imageBytes =
        imageData?.predictions?.[0]?.bytesBase64Encoded ||
        imageData?.predictions?.[0]?.image?.bytesBase64Encoded ||
        imageData?.generatedImages?.[0]?.image?.imageBytes || "";
      if (!imageBytes) return res.status(502).json({ error: "No image bytes returned from Gemini" });

      return res.status(200).json({ imageUrl: `data:image/png;base64,${imageBytes}`, modelId: actualImageModel });
    }

    // ─── VISION MODE (unchanged) ───
    if (mode === "vision") {
      if (hasUserKey) return res.status(403).json({ error: "Image analysis is available only in admin mode" });

      const mistralApiKey = process.env.MISTRAL_API_KEY || "";
      if (!mistralApiKey) return res.status(400).json({ error: "Missing API key (MISTRAL_API_KEY)" });

      const cleanImageBase64 = (imageBase64 || "").replace(/^data:.*;base64,/, "").trim();
      if (!cleanImageBase64) return res.status(400).json({ error: "imageBase64 is required" });

      const actualMimeType = (mimeType || "image/jpeg").trim() || "image/jpeg";
      const imageDataUrl = `data:${actualMimeType};base64,${cleanImageBase64}`;
      const visionPrompt = (prompt || "").trim() ||
        "Read the image carefully and return only the main text, question, or useful visible content from the image. Do not solve it unless the image itself asks for a direct answer.";

      const visionRes = await fetch(MISTRAL_CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${mistralApiKey}` },
        body: JSON.stringify({
          model: MISTRAL_MODEL,
          temperature: 0.1,
          reasoning_effort: "none",
          messages: [
            { role: "system", content: "You only analyze the image and extract the useful visible text, question, or content. Keep it clean and concise. Do not add extra explanation unless necessary." },
            { role: "user", content: [
              { type: "text", text: visionPrompt },
              { type: "image_url", image_url: imageDataUrl },
            ]},
          ],
        }),
      });

      const visionRaw = await visionRes.text();
      let visionData: any = null;
      try { visionData = visionRaw ? JSON.parse(visionRaw) : null; } catch { visionData = null; }

      if (!visionRes.ok) {
        return res.status(visionRes.status).json({ error: formatMistralError(visionData, visionRaw, visionRes.status) });
      }

      const extracted = extractChatContent(visionData?.choices?.[0]?.message?.content).text;
      return res.status(200).json({ text: extracted, modelId: MISTRAL_MODEL });
    }

    // ─── TRANSCRIBE MODE (unchanged) ───
    if (mode === "transcribe") {
      if (hasUserKey) return res.status(403).json({ error: "Voice transcription is available only in admin mode" });

      const groqApiKey = process.env.GROQ_API_KEY || "";
      if (!groqApiKey) return res.status(400).json({ error: "Missing API key (GROQ_API_KEY)" });

      const cleanBase64 = (audioBase64 || "").replace(/^data:.*;base64,/, "").trim();
      if (!cleanBase64) return res.status(400).json({ error: "audioBase64 is required" });

      const actualMimeType = (mimeType || "audio/webm").trim() || "audio/webm";
      const audioBuffer = Buffer.from(cleanBase64, "base64");
      const audioBlob = new Blob([audioBuffer], { type: actualMimeType });
      const ext = actualMimeType.includes("wav") ? "wav"
        : actualMimeType.includes("ogg") ? "ogg"
        : actualMimeType.includes("mp4") ? "mp4"
        : actualMimeType.includes("mpeg") || actualMimeType.includes("mp3") ? "mp3" : "webm";

      const formData = new FormData();
      formData.append("model", "whisper-large-v3-turbo");
      formData.append("file", audioBlob, `voice.${ext}`);
      formData.append("response_format", "json");
      if (language && language.trim()) formData.append("language", language.trim());

      const sttRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST", headers: { Authorization: `Bearer ${groqApiKey}` }, body: formData,
      });
      const sttRaw = await sttRes.text();
      let sttData: any = null;
      try { sttData = sttRaw ? JSON.parse(sttRaw) : null; } catch { sttData = { text: sttRaw }; }
      if (!sttRes.ok) return res.status(sttRes.status).json({ error: sttData?.error?.message || sttData?.error || "Transcription failed" });

      const text = typeof sttData?.text === "string" ? sttData.text.trim() : "";
      return res.status(200).json({ text, modelId: "whisper-large-v3-turbo" });
    }

    // ─── CHAT MODE ─── (শুধু stream: true এবং stream পার্স করা)
    const apiKey = hasUserKey ? keyFromClient : (process.env.MISTRAL_API_KEY || "");
    if (!apiKey) {
      return res.status(400).json({ error: hasUserKey ? "Missing API key (userKey)" : "Missing API key (MISTRAL_API_KEY)" });
    }

    const customSystemText = typeof systemInstruction === "string" ? systemInstruction.trim() : "";
    const instructionsText = [ELIYEN_SYSTEM_PROMPT, customSystemText].filter(Boolean).join("\n\n");

    const wantsThinking = thinkingMode === true;
    const effort = wantsThinking ? "high" : "none";

    // এখন stream: true দিয়ে কল করব
    const chatRes = await fetch(MISTRAL_CONVERSATIONS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: MISTRAL_MODEL,
        instructions: instructionsText,
        inputs: sanitizeInputs(messages),
        stream: true,   // ✅ স্ট্রিমিং চালু
        tools: [{ type: "web_search" }],
        completion_args: { reasoning_effort: effort },
      }),
    });

    // যদি স্ট্রিমিং রিকোয়েস্ট হয় এবং রেসপন্স ঠিক থাকে
    if (mode === "chat" && stream === true) {
      if (!chatRes.ok || !chatRes.body) {
        const raw = await chatRes.text();
        let data = null;
        try { data = JSON.parse(raw); } catch { /* ignore */ }
        const errMsg = formatMistralError(data, raw, chatRes.status);
        res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache, no-transform");
        res.setHeader("Connection", "keep-alive");
        sendDelta(res, { content: `⚠️ ${errMsg}` });
        res.write("data: [DONE]\n\n");
        res.end();
        return;
      }

      res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");

      const reader = chatRes.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const payload = line.slice(6).trim();
              if (payload === "[DONE]" || payload === "") continue;
              try {
                const parsed = JSON.parse(payload);
                // Conversations API থেকে আসা stream-এ outputs থাকে
                if (parsed?.outputs && Array.isArray(parsed.outputs)) {
                  // প্রতিটি output থেকে reasoning এবং text বের করি
                  for (const out of parsed.outputs) {
                    if (out?.type === "message.output") {
                      const { reasoning, text } = extractChatContent(out.content);
                      if (reasoning) sendDelta(res, { reasoning });
                      if (text) sendDelta(res, { content: text });
                    }
                  }
                }
                // কখনো কখনো delta ফিল্ডেও আসতে পারে (Mistral-এর কিছু ভার্সনে)
                if (parsed?.delta) {
                  const d = parsed.delta;
                  const deltaToSend: any = {};
                  if (d.reasoning) deltaToSend.reasoning = d.reasoning;
                  if (d.content) deltaToSend.content = d.content;
                  if (Object.keys(deltaToSend).length > 0) {
                    sendDelta(res, deltaToSend);
                  }
                }
              } catch (e) {
                // JSON parse error হলে skip
              }
            }
          }
        }
      } catch (e) {
        // stream read error
      } finally {
        res.write("data: [DONE]\n\n");
        res.end();
      }
      return;
    }

    // ── non-streaming fallback ──
    const chatRaw = await chatRes.text();
    let chatData: any = null;
    try { chatData = chatRaw ? JSON.parse(chatRaw) : null; } catch { chatData = null; }

    if (!chatRes.ok || !chatData) {
      const realMsg = formatMistralError(chatData, chatRaw, chatRes.status);
      return res.status(chatRes.status || 502).json({ error: realMsg });
    }

    const { reasoning, text } = extractConversationOutput(chatData?.outputs);
    const cleanContent = text || "⚠️ Empty response from model";

    return res.status(200).json({ text: cleanContent });

  } catch (err: any) {
    return res.status(500).json({ error: err?.message || String(err) || "Internal server error" });
  }
}
