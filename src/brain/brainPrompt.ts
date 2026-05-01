// ASK-GPT Brain - Semantic Classifier Prompt Builder
// This prompt instructs the AI model to understand intent semantically.
// No keyword/regex logic here. The AI does the understanding.

import type { BrainInput } from './brainTypes';
import { BRAIN_VERSION } from './brainConfig';

const MODEL_ROLES = `
AVAILABLE MODELS AND THEIR ROLES:
- llama-3.3-70b-versatile → General conversation, simple questions, casual chat, everyday assistant tasks.
- openai/gpt-oss-120b → Hard reasoning, math, physics, logic, coding, debugging, deep analysis, multi-step thinking.
- openai/gpt-oss-20b → Quick lightweight reasoning, simple problem solving, fast answers.
- qwen/qwen3-32b → Bangla writing, multilingual tasks, translation, captions, social posts, paragraphs, rewrites.
- groq/compound → Current information, live data, news, prices, recent events, anything that needs web search.
`.trim();

const ROUTE_DESCRIPTIONS = `
ROUTES:
- normal → general chat, simple factual answer
- thinking → reasoning, math, coding, analysis
- writing → writing, translation, caption, post
- web → current/live/latest information needed
- image_analysis → image attached or visual understanding needed
- workflow → user has multiple different tasks in one message
`.trim();

const OUTPUT_SCHEMA = `
OUTPUT JSON SCHEMA (return this exact structure, no extra text):
{
  "version": "${BRAIN_VERSION}",
  "intent": string,
  "route": "normal"|"thinking"|"writing"|"web"|"image_analysis"|"workflow",
  "language": "en"|"bn"|"mixed"|"auto",
  "tone": "default"|"friendly"|"professional"|"simple"|"funny"|"direct"|"calm",
  "depth": "short"|"balanced"|"detailed",
  "needsWeb": boolean,
  "needsReasoning": boolean,
  "needsImageAnalysis": boolean,
  "needsWriting": boolean,
  "needsTranslation": boolean,
  "isMultiTask": boolean,
  "modelId": string,
  "tasks": [
    {
      "id": "task_1",
      "type": "web"|"reasoning"|"writing"|"translation"|"image_analysis"|"general",
      "description": string,
      "route": string,
      "modelId": string
    }
  ],
  "finalResponsePlan": string
}
`.trim();

const MULTI_TASK_RULE = `
MULTI-TASK RULE:
If the user request contains multiple different goals (e.g. find news AND explain AND write a post),
set isMultiTask=true, route="workflow", and split into separate tasks array.
Each task should use the most appropriate model for that specific sub-task.
Do NOT merge different task types into one task.
`.trim();

const LANGUAGE_RULE = `
LANGUAGE RULE:
Detect the language the user wrote in. Set language to "bn" for Bangla, "en" for English, "mixed" for both.
If unclear, use "auto". The finalResponsePlan should say what language to respond in.
`.trim();

const TONE_DEPTH_RULE = `
TONE AND DEPTH RULE:
Understand the user's tone and how detailed they want the response.
If they seem frustrated or upset, use tone="calm".
If they ask for step-by-step, use depth="detailed".
If they ask for something short, use depth="short".
`.trim();

// Build the full classifier prompt for the brain model
export function buildBrainClassifierPrompt(input: BrainInput): string {
  const imageContext = input.hasImage
    ? 'NOTE: The user has attached an image.'
    : '';

  const modeContext = input.selectedMode
    ? `User selected mode: ${input.selectedMode}.`
    : '';

  const customContext = input.userSettings?.customInstructions
    ? `User custom instruction: ${input.userSettings.customInstructions.slice(0, 100)}`
    : '';

  const recentContext = input.recentContext
    ? `Recent conversation context: ${input.recentContext.slice(0, 150)}`
    : '';

  return `You are ASK-GPT Brain, a semantic intent classifier.
Your job is to understand what the user truly wants and return a routing decision as JSON.

CRITICAL RULES:
- Return ONLY valid JSON. No explanation. No markdown. No code fences.
- Understand the user's MEANING, not just their words.
- Do not rely on keyword matching. Think about what the user actually needs.
- Keep task descriptions short (under 15 words each).
- Keep finalResponsePlan under 20 words.

${MODEL_ROLES}

${ROUTE_DESCRIPTIONS}

${MULTI_TASK_RULE}

${LANGUAGE_RULE}

${TONE_DEPTH_RULE}

${OUTPUT_SCHEMA}

${imageContext}
${modeContext}
${customContext}
${recentContext}

USER MESSAGE:
"${input.text.slice(0, 400)}"

Return JSON only:`;
  }
