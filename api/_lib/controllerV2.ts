export interface ControllerV2Input {
  prompt: string;
  messages: any[];
  systemInstruction?: string;
  hasImage?: boolean;
  imageContext?: string;
}

export interface ControllerV2Plan {
  needs_reasoning: boolean;
  needs_web: boolean;
  is_simple: boolean;
  confidence: number;
}

export interface ControllerV2Result {
  ok: boolean;
  plan: ControllerV2Plan;
  imageContext: string;
  reasoningOutput: string;
  webOutput: string;
  fastOutput: string;
  refinedOutput: string;
  finalText: string;
  reason?: string;
}

export const CONTROLLER_V2_MODELS = {
  mainBrain: "openai/gpt-oss-120b",
  reasoning: "qwen/qwen3-32b",
  image: "meta-llama/llama-4-scout-17b-16e-instruct",
  web: "groq/compound",
  fast: "llama-3.3-70b-versatile",
} as const;

export const CONTROLLER_V2_PLAN_PROMPT = `User request deeply বুঝো।
যদি extra help লাগে, decide করো।
Multiple helpers লাগতে পারে।

Return ONLY valid JSON:

{
  "needs_reasoning": true,
  "needs_web": false,
  "is_simple": false,
  "confidence": 0.84
}`;

export const CONTROLLER_V2_REFINE_PROMPT = `You are the main brain.
Review all hidden helper results carefully.
If any helper result is weak, unclear, incomplete, or low quality, improve it into a stronger clean draft.
Do not mention hidden helpers, internal tools, routing, or model switching.`;

export const CONTROLLER_V2_FINAL_PROMPT = `Write the final answer in a clean, structured, human-like way.
Keep one-brain feel.
Do not mention hidden helpers, internal tools, routing, or model switching.`;

export const DEFAULT_CONTROLLER_V2_PLAN: ControllerV2Plan = {
  needs_reasoning: false,
  needs_web: false,
  is_simple: false,
  confidence: 0,
};

export const parseControllerV2Plan = (raw: string): ControllerV2Plan => {
  const source = (raw || "").trim();

  const normalize = (parsed: any): ControllerV2Plan => ({
    needs_reasoning: Boolean(parsed?.needs_reasoning),
    needs_web: Boolean(parsed?.needs_web),
    is_simple: Boolean(parsed?.is_simple),
    confidence: Math.max(
      0,
      Math.min(
        1,
        typeof parsed?.confidence === "number" ? parsed.confidence : 0
      )
    ),
  });

  const tryParse = (value: string): ControllerV2Plan | null => {
    try {
      return normalize(JSON.parse(value || "{}"));
    } catch {
      return null;
    }
  };

  const directParsed = tryParse(source);
  if (directParsed) return directParsed;

  const fencedMatch = source.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    const fencedParsed = tryParse(fencedMatch[1]);
    if (fencedParsed) return fencedParsed;
  }

  const jsonMatch = source.match(/\{[\s\S]*\}/);
  if (jsonMatch?.[0]) {
    const looseParsed = tryParse(jsonMatch[0]);
    if (looseParsed) return looseParsed;
  }

  return DEFAULT_CONTROLLER_V2_PLAN;
};

export const buildControllerV2PlanMessages = (input: ControllerV2Input) => {
  const userBlock = [
    `User request:\n${input.prompt || ""}`,
    input.imageContext?.trim()
      ? `Image result:\n${input.imageContext.trim()}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return [
    ...(input.systemInstruction?.trim()
      ? [
          {
            role: "system",
            content: input.systemInstruction.trim(),
          },
        ]
      : []),
    {
      role: "system",
      content: CONTROLLER_V2_PLAN_PROMPT,
    },
    ...input.messages,
    {
      role: "user",
      content: userBlock,
    },
  ];
};

export const buildControllerV2ReasoningPrompt = (
  input: ControllerV2Input
): string => {
  return [
    input.imageContext?.trim()
      ? `Image result:\n${input.imageContext.trim()}`
      : "",
    `Solve the user's request with deep reasoning.
Return only the useful reasoning result content.
Do not mention tools, hidden routing, or internal system details.

User request:
${input.prompt}`,
  ]
    .filter(Boolean)
    .join("\n\n");
};

export const buildControllerV2WebPrompt = (
  input: ControllerV2Input
): string => {
  return [
    input.imageContext?.trim()
      ? `Image result:\n${input.imageContext.trim()}`
      : "",
    `Find the latest relevant web-backed information for the user's request.
Return only the useful answer content.
Do not mention tools, hidden routing, or internal system details.

User request:
${input.prompt}`,
  ]
    .filter(Boolean)
    .join("\n\n");
};

export const buildControllerV2FastPrompt = (
  input: ControllerV2Input
): string => {
  return [
    input.imageContext?.trim()
      ? `Image result:\n${input.imageContext.trim()}`
      : "",
    `Create a fast helpful draft answer for the user's request.
Keep it concise and useful.
Do not mention tools, hidden routing, or internal system details.

User request:
${input.prompt}`,
  ]
    .filter(Boolean)
    .join("\n\n");
};

export const buildControllerV2RefineMessages = (
  input: ControllerV2Input,
  reasoningOutput: string,
  webOutput: string,
  fastOutput: string
) => {
  return [
    ...(input.systemInstruction?.trim()
      ? [
          {
            role: "system",
            content: input.systemInstruction.trim(),
          },
        ]
      : []),
    {
      role: "system",
      content: CONTROLLER_V2_REFINE_PROMPT,
    },
    ...input.messages,
    {
      role: "user",
      content: [
        `User request:\n${input.prompt || ""}`,
        input.imageContext?.trim()
          ? `Image result:\n${input.imageContext.trim()}`
          : "",
        reasoningOutput.trim()
          ? `Reasoning helper result:\n${reasoningOutput.trim()}`
          : "",
        webOutput.trim() ? `Web helper result:\n${webOutput.trim()}` : "",
        fastOutput.trim() ? `Fast draft result:\n${fastOutput.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
  ];
};

export const buildControllerV2FinalMessages = (
  input: ControllerV2Input,
  refinedOutput: string,
  reasoningOutput: string,
  webOutput: string,
  fastOutput: string
) => {
  return [
    ...(input.systemInstruction?.trim()
      ? [
          {
            role: "system",
            content: input.systemInstruction.trim(),
          },
        ]
      : []),
    {
      role: "system",
      content: CONTROLLER_V2_FINAL_PROMPT,
    },
    ...input.messages,
    {
      role: "user",
      content: [
        `User request:\n${input.prompt || ""}`,
        input.imageContext?.trim()
          ? `Image result:\n${input.imageContext.trim()}`
          : "",
        reasoningOutput.trim()
          ? `Reasoning helper result:\n${reasoningOutput.trim()}`
          : "",
        webOutput.trim() ? `Web helper result:\n${webOutput.trim()}` : "",
        fastOutput.trim() ? `Fast draft result:\n${fastOutput.trim()}` : "",
        refinedOutput.trim()
          ? `Refined draft:\n${refinedOutput.trim()}`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
  ];
};

export const runControllerV2 = async (
  input: ControllerV2Input
): Promise<ControllerV2Result> => {
  return {
    ok: false,
    plan: DEFAULT_CONTROLLER_V2_PLAN,
    imageContext: input.imageContext || "",
    reasoningOutput: "",
    webOutput: "",
    fastOutput: "",
    refinedOutput: "",
    finalText: "",
    reason: "controller_v2_not_implemented",
  };
};
