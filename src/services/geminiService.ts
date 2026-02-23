import Groq from "groq-sdk";
import { Message, Role } from "../types";

const client = new Groq({ apiKey: import.meta.env.VITE_GROQ_API_KEY || "" });

export const getGeminiResponse = async (
  prompt: string,
  history: Message[],
  modelId: string,
  systemInstruction: string = ""
): Promise<string> => {
  const messages = [
    ...(systemInstruction ? [{ role: "system" as const, content: systemInstruction }] : []),
    ...history.map(m => ({ role: (m.role === Role.USER ? "user" : "assistant") as const, content: m.content })),
    { role: "user" as const, content: prompt },
  ];

  const r = await client.chat.completions.create({
    model: modelId,
    messages,
    temperature: 0.7,
  });

  return r.choices?.[0]?.message?.content?.trim() || "I'm sorry, I couldn't generate a response.";
};
