// ASK-GPT Brain - JSON Parser
// Cleans and validates classifier output.
// No keyword routing. No user text inspection.

import type {
  BrainDecision,
  BrainClassifierResult,
  BrainRoute,
  BrainLanguage,
  BrainTone,
  BrainDepth,
  BrainIntent,
  BrainTaskType,
} from './brainTypes';
import { BRAIN_VERSION } from './brainConfig';
import { getModelForRoute } from './modelRouter';

const VALID_ROUTES: BrainRoute[] = [
  'normal',
  'thinking',
  'writing',
  'web',
  'image_analysis',
  'workflow',
];

const VALID_LANGUAGES: BrainLanguage[] = ['en', 'bn', 'mixed', 'auto'];

const VALID_TONES: BrainTone[] = [
  'default',
  'friendly',
  'professional',
  'simple',
  'funny',
  'direct',
  'calm',
];

const VALID_DEPTHS: BrainDepth[] = ['short', 'balanced', 'detailed'];

const VALID_TASK_TYPES: BrainTaskType[] = [
  'web',
  'reasoning',
  'writing',
  'translation',
  'image_analysis',
  'general',
];

const MODEL_ALIASES: Record<string, string> = {
  'llama-3.3-70b-versatile': 'llama-3.3-70b-versatile',
  'llama 3.3 70b': 'llama-3.3-70b-versatile',
  'llama-70b': 'llama-3.3-70b-versatile',

  'openai/gpt-oss-120b': 'openai/gpt-oss-120b',
  'gpt-oss-120b': 'openai/gpt-oss-120b',
  'gpt oss 120b': 'openai/gpt-oss-120b',
  'gptoss120b': 'openai/gpt-oss-120b',

  'openai/gpt-oss-20b': 'openai/gpt-oss-20b',
  'gpt-oss-20b': 'openai/gpt-oss-20b',
  'gpt oss 20b': 'openai/gpt-oss-20b',
  'gptoss20b': 'openai/gpt-oss-20b',

  'qwen/qwen3-32b': 'qwen/qwen3-32b',
  'qwen3-32b': 'qwen/qwen3-32b',
  'qwen 3-32b': 'qwen/qwen3-32b',
  'qwen-3-32b': 'qwen/qwen3-32b',

  'groq/compound': 'groq/compound',
  compound: 'groq/compound',

  image_analysis: 'image_analysis',
};

function normalizeModelId(value: unknown, route: BrainRoute): string {
  if (typeof value !== 'string') return getModelForRoute(route);

  const raw = value.trim();
  const key = raw.toLowerCase();

  return MODEL_ALIASES[key] || MODEL_ALIASES[raw] || getModelForRoute(route);
}

function normalizeRoute(value: unknown): BrainRoute {
  if (typeof value !== 'string') return 'normal';

  const route = value.trim().toLowerCase();

  if ((VALID_ROUTES as string[]).includes(route)) {
    return route as BrainRoute;
  }

  const aliases: Record<string, BrainRoute> = {
    general: 'normal',
    chat: 'normal',
    default: 'normal',

    reasoning: 'thinking',
    reason: 'thinking',
    math: 'thinking',
    coding: 'thinking',
    code: 'thinking',
    analysis: 'thinking',
    deep_analysis: 'thinking',

    quick: 'thinking',
    quick_reasoning: 'thinking',
    fast: 'thinking',

    translate: 'writing',
    translation: 'writing',
    caption: 'writing',
    rewrite: 'writing',
    copywriting: 'writing',

    current: 'web',
    latest: 'web',
    search: 'web',
    web_search: 'web',

    image: 'image_analysis',
    vision: 'image_analysis',

    multi_task: 'workflow',
    multitask: 'workflow',
    flow: 'workflow',
    merge: 'workflow',
  };

  return aliases[route] || 'normal';
}

function castToUnion<T>(value: unknown, validValues: T[], fallback: T): T {
  if (typeof value === 'string' && (validValues as string[]).includes(value)) {
    return value as T;
  }

  return fallback;
}

function cleanBrainRawOutput(raw: string): string {
  return String(raw || '')
    .replace(/\[groq\s*\|\s*[^\]]+\]\s*/gi, '')
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

function extractFirstJsonObject(text: string): string | null {
  const input = cleanBrainRawOutput(text);
  const start = input.indexOf('{');

  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < input.length; i += 1) {
    const char = input[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === '{') depth += 1;

    if (char === '}') {
      depth -= 1;

      if (depth === 0) {
        return input.slice(start, i + 1).trim();
      }
    }
  }

  return null;
}

function normalizeTask(raw: Record<string, unknown>, index: number) {
  const route = normalizeRoute(raw.route);

  return {
    id: typeof raw.id === 'string' && raw.id.trim() ? raw.id : `task_${index + 1}`,
    type: castToUnion<BrainTaskType>(
      raw.type,
      VALID_TASK_TYPES,
      route === 'web'
        ? 'web'
        : route === 'writing'
        ? 'writing'
        : route === 'image_analysis'
        ? 'image_analysis'
        : route === 'thinking'
        ? 'reasoning'
        : 'general'
    ),
    description:
      typeof raw.description === 'string'
        ? raw.description.slice(0, 180)
        : '',
    route,
    modelId: normalizeModelId(raw.modelId, route),
  };
}

function normalizeBrainDecision(raw: Record<string, unknown>): BrainDecision {
  const route = normalizeRoute(raw.route);

  const rawTasks = Array.isArray(raw.tasks) ? raw.tasks : [];
  const tasks = rawTasks
    .filter((task): task is Record<string, unknown> => {
      return typeof task === 'object' && task !== null && !Array.isArray(task);
    })
    .map((task, index) => normalizeTask(task, index));

  const modelId = normalizeModelId(raw.modelId, route);

  return {
    version: BRAIN_VERSION,
    intent:
      typeof raw.intent === 'string' && raw.intent.trim()
        ? (raw.intent as BrainIntent)
        : ('general' as BrainIntent),
    route,
    language: castToUnion<BrainLanguage>(raw.language, VALID_LANGUAGES, 'auto'),
    tone: castToUnion<BrainTone>(raw.tone, VALID_TONES, 'default'),
    depth: castToUnion<BrainDepth>(raw.depth, VALID_DEPTHS, 'balanced'),
    needsWeb: raw.needsWeb === true,
    needsReasoning: raw.needsReasoning === true,
    needsImageAnalysis: raw.needsImageAnalysis === true,
    needsWriting: raw.needsWriting === true,
    needsTranslation: raw.needsTranslation === true,
    isMultiTask: raw.isMultiTask === true || route === 'workflow',
    modelId,
    tasks,
    finalResponsePlan:
      typeof raw.finalResponsePlan === 'string' && raw.finalResponsePlan.trim()
        ? raw.finalResponsePlan.slice(0, 450)
        : 'Answer the user clearly and helpfully.',
  };
}

export function parseBrainClassifierOutput(raw: string): BrainClassifierResult {
  const jsonText = extractFirstJsonObject(raw);

  if (!jsonText) {
    return {
      raw,
      parsed: null,
      success: false,
      error: 'No JSON object found in brain output.',
    };
  }

  try {
    const parsed = JSON.parse(jsonText);

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return {
        raw,
        parsed: null,
        success: false,
        error: 'Parsed brain output is not an object.',
      };
    }

    const normalized = normalizeBrainDecision(parsed as Record<string, unknown>);

    return {
      raw,
      parsed: normalized,
      success: true,
    };
  } catch (error) {
    return {
      raw,
      parsed: null,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown JSON parse error.',
    };
  }
    }
