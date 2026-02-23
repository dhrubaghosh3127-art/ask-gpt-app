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
    { role: "system", content: (systemInstruction?.trim() || DEFAULT_SYSTEM_PROMPT).slice(0, 1500) },
    ...history.slice(-12).map((m) => ({
      role: m.role === Role.USER ? "user" : "assistant",
      content: (m.content || "").slice(0, 1200),
    })),
    
  ];

  const res = await fetch(URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({ model: modelId, messages, temperature: 0.7, max_tokens: 512 }),
  });

  const data = await res.json(); console.log("Groq status:", res.status, data);
if (!res.ok) throw new Error(data?.error?.message ?? data?.message ?? `Groq API Error (${res.status})`);
  return((((data?.choices?.[0]?.message?.content as string)||"").replace(/<think>[\s\S]*?<\/think>\s*/g,"").trim())||"Error: Please try again.");
};
