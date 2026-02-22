import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, Role } from "../types";
import { DEFAULT_MODEL_ID, HARD_MODEL_ID, VERY_HARD_MODEL_ID } from '../constants';
// Note: In this environment, process.env.API_KEY is pre-configured
const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

export const getGeminiResponse = async (
  prompt: string, 
  history: Message[], 
  modelId: string = DEFAULT_MODEL_ID,
  systemInstruction: string = ''
): Promise<string> => {
  try {
    const chatHistory = history.map(msg => ({
      role: msg.role === Role.USER ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // For better results, we prepend system instruction if present
    const contents = [...chatHistory, { role: 'user', parts: [{ text: prompt }] }];

    const response = await ai.models.generateContent({
      model: modelId,
      contents: contents,
      config: {
        systemInstruction: systemInstruction || "You are ASK-GPT, a helpful and professional AI assistant. You can help with writing, translation, study, and coding.",
        temperature: 0.7,
        topP: 0.95,
      }
    });

    return response.text || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
    
