export const USE_CONTROLLER_V2 = false;

export const CONTROLLER_V2_CONFIG = {
  plannerMinConfidence: 0.45,
  maxFeedbackRetries: 2,
  enableFeedbackLoop: true,
  enableFastPath: true,
  fastPathMaxPromptLength: 120,
  useImagePrecheck: true,
} as const;
