import { GoogleGenerativeAI } from "@google/generative-ai";
import { Message, Role } from "../types";

/**
 * Note: Apnar environment-e process.env.API_KEY oboshoy thakte hobe.
 * Vercel Dashboard -> Settings -> Environment Variables e 'API_KEY' name e key add korun.
 */
const genAI = new GoogleGenerativeAI(process.env.API_KEY || '');

export const getGeminiResponse = async (
  prompt: string, 
  history: Message[] = [], 
  modelId: string = 'gemini-1.5-flash', // Stable ebong fast model
  systemInstruction: string = ''
): Promise<string> => {
  try {
    // 1. Initialize the model
    const model = genAI.getGenerativeModel({ 
      model: modelId,
      systemInstruction: systemInstruction || "You are ASK-GPT, a helpful AI assistant."
    });

    // 2. Format history for Gemini SDK
    // Gemini SDK role 'user' ebong 'model' (assistant noy) support kore
    const chatHistory = history.map(msg => ({
      role: msg.role === Role.USER ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // 3. Start a chat session
    const chatSession = model.startChat({
      history: chatHistory,
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 1024, // Resource bachanur jonno limit
      },
    });

    // 4. Send message and get response
    const result = await chatSession.sendMessage(prompt);
    const response = await result.response;
    const text = response.text();

    if (!text) {
      throw new Error("Empty response from Gemini");
    }

    return text;

  } catch (error: any) {
    // Error ta console e log korbe jate Vercel logs e dekha jay
    console.error("Gemini Service Error:", error.message || error);

    // Common error handling
    if (error.message?.includes("429")) {
      return "Rate limit cross hoyeche. Please 1 minute por abar try korun.";
    }
    
    if (error.message?.includes("API_KEY_INVALID")) {
      return "Apnar API Key-te somossa ache. Vercel-e key check korun.";
    }

    throw new Error("Gemini API connection failed. Check network or configuration.");
  }
};
