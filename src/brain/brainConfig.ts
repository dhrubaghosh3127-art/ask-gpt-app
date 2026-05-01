// ASK-GPT Brain Config
// BRAIN_MODE = 'old' means current app works normally, brain is inactive

export const BRAIN_MODE = 'old' as 'old' | 'new';

export const BRAIN_VERSION = 'v1';

export const BRAIN_CLASSIFIER_MODEL_ID = 'openai/gpt-oss-120b';

export const BRAIN_TOKEN_CONFIG = {
  maxTokens: 250,
  temperature: 0,
  topP: 1,
};
