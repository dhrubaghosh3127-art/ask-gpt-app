// ASK-GPT Brain - Model Router

import type { BrainDecision, BrainRoute } from './brainTypes';

// Model constants
export const MODELS = {
  NORMAL: 'llama-3.3-70b-versatile',
  REASONING: 'openai/gpt-oss-120b',
  FAST: 'openai/gpt-oss-20b',
  WRITING: 'qwen/qwen3-32b',
  WEB: 'groq/compound',
} as const;

// Choose default model based on route
export function chooseDefaultModelForRoute(route: BrainRoute): string {
  switch (route) {
    case 'thinking':
      return MODELS.REASONING;
    case 'writing':
      return MODELS.WRITING;
    case 'web':
      return MODELS.WEB;
    case 'image_analysis':
      return MODELS.REASONING;
    case 'normal':
    default:
      return MODELS.NORMAL;
  }
}

// Choose model based on full brain decision
export function chooseModelForDecision(decision: BrainDecision): string {
  if (decision.needsImageAnalysis) return MODELS.REASONING;
  if (decision.needsWeb) return MODELS.WEB;
  if (decision.needsWriting || decision.needsTranslation) return MODELS.WRITING;
  if (decision.needsReasoning) return MODELS.REASONING;
  return chooseDefaultModelForRoute(decision.route);
}
