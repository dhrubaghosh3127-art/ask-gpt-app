// ASK-GPT Brain - Prompt Builder

import type { BrainInput } from './brainTypes';

const JSON_SCHEMA = `{
  "version": "v1",
  "intent": string,
  "route": "normal"|"thinking"|"writing"|"web"|"image_analysis"|"workflow",
  "language": "en"|"bn"|"mixed",
  "tone": "default"|"friendly"|"professional"|"simple"|"funny"|"direct"|"calm",
  "depth": "short"|"balanced"|"detailed",
  "needsWeb": boolean,
  "needsReasoning": boolean,
  "needsImageAnalysis": boolean,
  "needsWriting": boolean,
  "needsTranslation": boolean,
  "isMultiTask": boolean,
  "modelId": string,
  "tasks": [{ "id": string, "type": string, "description": string, "route": string, "modelId": string }],
  "finalResponsePlan": string
}`;

// Build short classifier prompt for brain model
export function buildBrainClassifierPrompt(input: BrainInput): string {
  const imageNote = input.hasImage ? 'An image is attached.' : '';
  const modeNote = input.selectedMode ? `Mode: ${input.selectedMode}.` : '';
  const contextNote = input.recentContext
    ? `Recent context: ${input.recentContext.slice(0, 200)}`
    : '';

  return `You are ASK-GPT Brain. Analyze the user message and return ONLY a JSON decision.
No explanation. No markdown. Only valid JSON.

Schema:
${JSON_SCHEMA}

${imageNote} ${modeNote} ${contextNote}

User message: "${input.text}"

Return JSON only.`;
}
