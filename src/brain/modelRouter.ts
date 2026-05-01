// ASK-GPT Brain - Model Router
// Only model constants and utility helpers.
// No keyword logic. No regex. No word inspection.

import type { BrainDecision, BrainInput, BrainRoute } from './brainTypes';
import { BRAIN_VERSION } from './brainConfig';

// Model ID constants
export const MODELS = {
  // General chat and conversation
  NORMAL: 'llama-3.3-70b-versatile',

  // Hard reasoning, math, coding, deep analysis
  REASONING: 'openai/gpt-oss-120b',

  // Quick lightweight reasoning
  FAST: 'openai/gpt-oss-20b',

  // Bangla, multilingual, writing, translation
  WRITING: 'qwen/qwen3-32b',

  // Web/current/live information
  WEB: 'groq/compound',
} as const;

// Return model ID for a given route.
// This is a model lookup only — the route was already decided by the AI classifier.
export function getModelForRoute(route: BrainRoute): string {
  const map: Record<BrainRoute, string> = {
    normal: MODELS.NORMAL,
    thinking: MODELS.REASONING,
    writing: MODELS.WRITING,
    web: MODELS.WEB,
    image_analysis: MODELS.REASONING,
    workflow: MODELS.REASONING,
  };
  return map[route] ?? MODELS.NORMAL;
}

// Normalize a model ID coming from classifier to a known valid model.
export function normalizeModelId(modelId: string): string {
  const known = Object.values(MODELS) as string[];
  if (known.includes(modelId)) return modelId;
  return MODELS.NORMAL;
}

// Generic safe fallback decision.
// Used when Brain is inactive or classifier fails.
// Does NOT inspect input text — fully generic.
export function getFallbackBrainDecision(_input: BrainInput): BrainDecision {
  return {
    version: BRAIN_VERSION,
    intent: 'general',
    route: 'normal',
    language: 'auto',
    tone: 'default',
    depth: 'balanced',
    needsWeb: false,
    needsReasoning: false,
    needsImageAnalysis: false,
    needsWriting: false,
    needsTranslation: false,
    isMultiTask: false,
    modelId: MODELS.NORMAL,
    tasks: [],
    finalResponsePlan: 'Answer the user helpfully.',
  };
    }
