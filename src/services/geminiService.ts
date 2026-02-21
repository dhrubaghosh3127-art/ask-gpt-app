import { GoogleGenAI } from "@google/genai";
import { Message, Role } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
if (!API_KEY) throw new Error("Missing VITE_GEMINI_API_KEY");

const ai = new GoogleGenAI({ apiKey: API_KEY });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const getGeminiResponse = async (
  prompt: string,
  history: Message[],
  modelId: string = "gemini-2.0-flash",
  systemInstruction: string = ""
): Promise<string> => {
  // speed + less error: last 12 message only
  const chatHistory = history.slice(-12).map((msg) => ({
    role: msg.role === Role.USER ? "user" : "model",
    parts: [{ text: msg.content }],
  }));

  const contents = [...chatHistory, { role: "user", parts: [{ text: prompt }] }];

  const maxRetries = 2;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: modelId,
        contents,
        config: {
          systemInstruction:
            systemInstruction || "You are ASK-GPT, a helpful AI assistant.",
          candidateCount: 1,
          maxOutputTokens: 768,
          temperature: 0.7,
          topP: 0.95,
        },
      });

      return response.text || "I'm sorry, I couldn't generate a response.";
    } catch (err: any) {
      const msg = String(err?.message || err);

      const retryable =
        attempt < maxRetries &&
        (msg.includes("429") ||
          msg.includes("503") ||
          msg.toLowerCase().includes("network") ||
          msg.toLowerCase().includes("fetch"));

      if (retryable) {
        await sleep(700 * (attempt + 1));
        continue;
      }

      throw new Error(`Gemini request failed: ${msg}`);
    }
  }

  return "I'm sorry, I couldn't generate a response.";
};
