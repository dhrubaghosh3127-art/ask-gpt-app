// ASK-GPT Brain - JSON Parser
// Parses and validates classifier model output.
// Allowed: string parsing, JSON validation, structure normalization.
// NOT allowed: keyword routing or intent inference from text.

import type { BrainDecision, BrainClassifierResult, BrainRoute, BrainLanguage, BrainTone, BrainDepth, BrainIntent, BrainTaskType } from './brainTypes';
import { BRAIN_VERSION } from './brainConfig';
import { normalizeModelId, getModelForRoute } from './modelRouter';

const VALID_ROUTES: BrainRoute[] = ['normal', 'thinking', 'writing', 'web', 'image_analysis', 'workflow'];
const VALID_LANGUAGES: BrainLanguage[] = ['en', 'bn', 'mixed', 'auto'];
const VALID_TONES: BrainTone[] = ['default', 'friendly', 'professional', 'simple', 'funny', 'direct', 'calm'];
const VALID_DEPTHS: BrainDepth[] = ['short', 'balanced', 'detailed'];
const VALID_TASK_TYPES: BrainTaskType[] = ['web', 'reasoning', 'writing', 'translation', 'image_analysis', 'general'];

// Strip markdown code fences if model wraps JSON in them
function stripCodeFences(raw: string): string {
  return raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

// Safely cast a value to a valid union type
function castToUnion<T>(value: unknown, validValues: T[], fallback: T): T {
  if (typeof value === 'string' && (validValues as string[]).includes(value)) {
    return value as T;
  }
  return fallback;
}

// Normalize a single task from raw parsed object
function normalizeTask(raw: Record<string, unknown>, index: number) {
  const route = castToUnion<BrainRoute>(raw.route, VALID_ROUTES, 'normal');
  return {
    id: typeof raw.id === 'string' ? raw.id : `task_${index + 1}`,
    type: castToUnion<BrainTaskType>(raw.type, VALID_TASK_TYPES, 'general'),
    description: typeof raw.description === 'string' ? raw.description.slice(0, 100) : '',
    route,
    modelId: typeof raw.modelId === 'string' ? normalizeModelId(raw.modelId) : getModelForRoute(route),
  };
}

// Normalize raw parsed object into a valid BrainDecision
function normalizeBrainDecision(raw: Record<string, unknown>): BrainDecision {
  const route = castToUnion<BrainRoute>(raw.route, VALID_ROUTES, 'normal');

  const rawTasks = Array.isArray(raw.tasks) ? raw.tasks : [];
  const tasks = rawTasks
    .filter((t): t is Record<string, unknown> => typeof t === 'object' && t !== null)
    .map((t, i) => normalizeTask(t, i));

  return {
    version: BRAIN_VERSION,
    intent: (typeof raw.intent === 'string' ? raw.intent : 'general') as BrainIntent,
    route,
    language: castToUnion<BrainLanguage>(raw.language, VALID_LANGUAGES, 'auto'),
    tone: castToUnion<BrainTone>(raw.tone, VALID_TONES, 'default'),
    depth: castToUnion<BrainDepth>(raw.depth, VALID_DEPTHS, 'balanced'),
    needsWeb: raw.needsWeb === true,
    needsReasoning: raw.needsReasoning === true,
    needsImageAnalysis: raw.needsImageAnalysis === true,
    needsWriting: raw.needsWriting === true,
    needsTranslation: raw.needsTranslation === true,
    isMultiTask: raw.isMultiTask === true,
    modelId: typeof raw.modelId === 'string'
      ? normalizeModelId(raw.modelId)
      : getModelForRoute(route),
    tasks,
    finalResponsePlan: typeof raw.finalResponsePlan === 'string'
      ? raw.finalResponsePlan.slice(0, 200)
      : 'Answer the user helpfully.',
  };
}

// Main parse function
export function parseBrainClassifierOutput(raw: string): BrainClassifierResult {
  const cleaned = stripCodeFences(raw);

  try {
    const parsed = JSON.parse(cleaned);

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return { raw, parsed: null, success: false, error: 'Parsed value is not an object.' };
    }

    const normalized = normalizeBrainDecision(parsed as Record<string, unknown>);
    return { raw, parsed: normalized, success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown parse error.';
    return { raw, parsed: null, success: false, error: message };
  }
    }
