import { Message, Role } from "../types";

const API_KEY = import.meta.env.VITE_GROQ_API_KEY || "";
const URL = "https://api.groq.com/openai/v1/chat/completions";

export const getGeminiResponse = async (
  prompt: string,
  history: Message[],
  modelId: string,
  systemInstruction: string = ""
): Promise<string> => {
  const messages = [
    ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
    ...history.map((m) => ({
      role: m.role === Role.USER ? "user" : "assistant",
      content: m.content,
    })),
    { role: "user", content: prompt },
  ];

  const res = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ model: modelId, messages, temperature: 0.7 }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Groq API Error");

  return (data?.choices?.[0]?.message?.content || "").trim() || "I'm sorry, I couldn't generate a response.";
};
