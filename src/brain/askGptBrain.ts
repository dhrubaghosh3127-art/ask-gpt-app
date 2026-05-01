// ASK-GPT Brain - Main Controller
// This is the only file ChatPage will import later.
// Currently inactive by default. Current app is NOT affected.

import type { BrainInput, BrainDecision } from './brainTypes';
import { BRAIN_MODE, ENABLE_AI_BRAIN_CLASSIFIER } from './brainConfig';
import { classifyWithBrainModel } from './brainClassifier';
import { getFallbackBrainDecision } from './modelRouter';

// Main brain function.
//
// BRAIN_MODE = 'old'  → safe fallback, no classification, current app unchanged.
// BRAIN_MODE = 'new'  → calls AI classifier if ENABLE_AI_BRAIN_CLASSIFIER = true.
//                        if classifier fails → safe fallback.
//
// Never connects to ChatPage until you manually import and call this.

export async function decideAskGptRoute(input: BrainInput): Promise<BrainDecision> {
  // Old mode: brain is fully inactive
  if (BRAIN_MODE === 'old') {
    return getFallbackBrainDecision(input);
  }

  // New mode but classifier disabled: still return safe fallback
  if (!ENABLE_AI_BRAIN_CLASSIFIER) {
    return getFallbackBrainDecision(input);
  }

  // New mode + classifier enabled: call AI classifier
  return classifyWithBrainModel(input);
}
