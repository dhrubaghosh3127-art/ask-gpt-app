// ASK-GPT Brain Config - v2 Semantic
// Default: everything inactive. Current app is NOT affected.

export const BRAIN_MODE: 'old' | 'new' = 'new';

export const BRAIN_VERSION = 'v2-semantic';

export const BRAIN_CLASSIFIER_MODEL_ID = 'openai/gpt-oss-120b';

export const BRAIN_CLASSIFIER_MAX_TOKENS = 250;

export const BRAIN_CLASSIFIER_TEMPERATURE = 0;

// Master switch for AI classifier API call.
// Must be explicitly set to true to activate.
export const ENABLE_AI_BRAIN_CLASSIFIER = true;
