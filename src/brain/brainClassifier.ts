import type { BrainDecision, BrainInput } from './brainTypes';

export async function classifyWithBrainModel(
  input: BrainInput
): Promise<BrainDecision> {
  void input;

  return {
    version: 'old-safe',
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
    modelId: 'llama-3.3-70b-versatile',
    tasks: [],
    finalResponsePlan: 'Answer normally and helpfully.',
    mergePlan: '',
    confidence: 0.5,
  } as BrainDecision;
}
