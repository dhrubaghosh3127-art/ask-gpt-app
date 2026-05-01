// ASK-GPT Brain Types - v2 Semantic

export type BrainMode = 'old' | 'new';

export type BrainIntent =
  | 'general'
  | 'casual_chat'
  | 'general_explanation'
  | 'math_reasoning'
  | 'coding'
  | 'deep_analysis'
  | 'writing'
  | 'translation'
  | 'current_information'
  | 'image_analysis'
  | 'study_help'
  | 'multi_task'
  | 'unknown';

export type BrainRoute =
  | 'normal'
  | 'thinking'
  | 'writing'
  | 'web'
  | 'image_analysis'
  | 'workflow';

export type BrainLanguage = 'en' | 'bn' | 'mixed' | 'auto';

export type BrainTone =
  | 'default'
  | 'friendly'
  | 'professional'
  | 'simple'
  | 'funny'
  | 'direct'
  | 'calm';

export type BrainDepth = 'short' | 'balanced' | 'detailed';

export type BrainTaskType =
  | 'web'
  | 'reasoning'
  | 'writing'
  | 'translation'
  | 'image_analysis'
  | 'general';

export interface BrainTask {
  id: string;
  type: BrainTaskType;
  description: string;
  route: BrainRoute;
  modelId: string;
}

export interface BrainInput {
  text: string;
  hasImage?: boolean;
  selectedMode?: 'Auto' | 'Fast' | 'Thinking';
  userApiKey?: string;
  userKey?: string;
  userSettings?: {
    tone?: BrainTone;
    responseStyle?: BrainDepth;
    defaultMode?: string;
    memoryEnabled?: boolean;
    customInstructions?: string;
    userName?: string;
    aboutUser?: string;
  };
  recentContext?: string;
}

export interface BrainDecision {
  version: string;
  intent: BrainIntent;
  route: BrainRoute;
  language: BrainLanguage;
  tone: BrainTone;
  depth: BrainDepth;
  needsWeb: boolean;
  needsReasoning: boolean;
  needsImageAnalysis: boolean;
  needsWriting: boolean;
  needsTranslation: boolean;
  isMultiTask: boolean;
  modelId: string;
  tasks: BrainTask[];
  finalResponsePlan: string;
}

// Raw output from brain classifier model before validation
export interface BrainClassifierResult {
  raw: string;
  parsed: BrainDecision | null;
  success: boolean;
  error?: string;
}
