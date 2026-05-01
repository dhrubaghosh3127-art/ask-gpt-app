// ASK-GPT Brain - AI Classifier
// Calls the existing /api/chat route to classify the user request.
// Only runs when ENABLE_AI_BRAIN_CLASSIFIER = true.
// No keyword logic here — classification is done by the AI model.

import type { BrainInput, BrainDecision } from './brainTypes';
import {
  BRAIN_CLASSIFIER_MODEL_ID,
  BRAIN_CLASSIFIER_MAX_TOKENS,
  BRAIN_CLASSIFIER_TEMPERATURE,
  ENABLE_AI_BRAIN_CLASSIFIER,
} from './brainConfig';
import { buildBrainClassifierPrompt } from './brainPrompt';
import { parseBrainClassifierOutput } from './jsonBrainParser';
import { getFallbackBrainDecision } from './modelRouter';

// Shape of the request body for /api/chat
interface ChatApiRequest {
  mode: string;
  stream: boolean;
  modelId: string;
  prompt: string;
  messages: unknown[];
  systemInstruction: string;
  userApiKey: string;
  userKey: string;
  maxTokens: number;
  temperature: number;
}

// Shape of the response from /api/chat
interface ChatApiResponse {
  content?: string;
  text?: string;
  error?: string;
}

// Extract text content from API response
function extractTextFromResponse(data: ChatApiResponse): string | null {
  if (typeof data.content === 'string' && data.content.trim()) return data.content.trim();
  if (typeof data.text === 'string' && data.text.trim()) return data.text.trim();
  return null;
}

// Call the brain classifier model via existing /api/chat route
export async function classifyWithBrainModel(input: BrainInput): Promise<BrainDecision> {
  if (!ENABLE_AI_BRAIN_CLASSIFIER) {
    return getFallbackBrainDecision(input);
  }

  const prompt = buildBrainClassifierPrompt(input);

  const requestBody: ChatApiRequest = {
    mode: 'chat',
    stream: false,
    modelId: BRAIN_CLASSIFIER_MODEL_ID,
    prompt,
    messages: [],
    systemInstruction: 'You are ASK-GPT Brain. Return JSON only. No explanation.',
    userApiKey: input.userApiKey ?? '',
    userKey: input.userKey ?? '',
    maxTokens: BRAIN_CLASSIFIER_MAX_TOKENS,
    temperature: BRAIN_CLASSIFIER_TEMPERATURE,
  };

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.warn('[ASK-GPT Brain] Classifier API call failed:', response.status);
      return getFallbackBrainDecision(input);
    }

    const data: ChatApiResponse = await response.json();
    const rawText = extractTextFromResponse(data);

    if (!rawText) {
      console.warn('[ASK-GPT Brain] Empty classifier response.');
      return getFallbackBrainDecision(input);
    }

    const result = parseBrainClassifierOutput(rawText);

    if (!result.success || !result.parsed) {
      console.warn('[ASK-GPT Brain] JSON parse failed:', result.error);
      return getFallbackBrainDecision(input);
    }

    return result.parsed;
  } catch (err) {
    console.warn('[ASK-GPT Brain] Classifier exception:', err);
    return getFallbackBrainDecision(input);
  }
}
