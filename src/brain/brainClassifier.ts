import type { BrainDecision, BrainInput } from './brainTypes';
import {
  BRAIN_CLASSIFIER_MODEL_ID,
  BRAIN_CLASSIFIER_MAX_TOKENS,
  BRAIN_CLASSIFIER_TEMPERATURE,
  ENABLE_AI_BRAIN_CLASSIFIER,
  DEBUG_BRAIN,
} from './brainConfig';
import { buildBrainClassifierPrompt } from './brainPrompt';
import { parseBrainClassifierOutput } from './jsonBrainParser';
import { createFallbackBrainDecision } from './modelRouter';

export async function classifyWithBrainModel(
  input: BrainInput
): Promise<BrainDecision> {
  if (!ENABLE_AI_BRAIN_CLASSIFIER) {
    return createFallbackBrainDecision(input);
  }

  const brainPrompt = buildBrainClassifierPrompt(input);

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      mode: 'chat',
      stream: false,
      modelId: BRAIN_CLASSIFIER_MODEL_ID,

      // IMPORTANT:
      // api/chat.ts chat mode reads from messages.
      // So the brain prompt must be sent as a user message.
      messages: [
        {
          role: 'user',
          content: brainPrompt,
        },
      ],

      // Keep prompt too for compatibility, but messages is the real one.
      prompt: brainPrompt,

      systemInstruction:
        'You are ASK-GPT Brain. You are only a semantic planner/router. Return strict JSON only. Do not answer the user. Do not use markdown. Do not explain.',

      temperature: BRAIN_CLASSIFIER_TEMPERATURE,
      max_tokens: BRAIN_CLASSIFIER_MAX_TOKENS,

      userApiKey: input.userApiKey || '',
      userKey: input.userKey || '',
    }),
  });

  const rawText = await res.text();

  if (DEBUG_BRAIN) {
    console.log('[ASK-GPT Brain raw]', rawText);
  }

  if (!res.ok) {
    throw new Error(rawText || 'Brain classifier request failed');
  }

  const parsed = parseBrainClassifierOutput(rawText);

  if (!parsed.success || !parsed.parsed) {
    if (DEBUG_BRAIN) {
      console.warn('[ASK-GPT Brain parse failed]', parsed.error, rawText);
    }

    throw new Error(parsed.error || 'Brain JSON parse failed');
  }

  return parsed.parsed;
}
