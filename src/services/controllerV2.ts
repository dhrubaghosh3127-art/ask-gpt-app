export type ControllerMode = "direct" | "reasoning" | "web";

export interface ControllerV2Input {
  prompt: string;
  messages: any[];
  systemInstruction?: string;
  hasImage?: boolean;
  imageContext?: string;
}

export interface ControllerV2Result {
  ok: boolean;
  mode: ControllerMode;
  confidence: number;
  imageContext: string;
  helperOutput: string;
  finalText: string;
  reason?: string;
}

export interface ControllerV2PlannerDecision {
  mode: ControllerMode;
  confidence: number;
}

export const CONTROLLER_V2_MODELS = {
  mainBrain: "openai/gpt-oss-120b",
  reasoning: "qwen/qwen3-32b",
  image: "meta-llama/llama-4-scout-17b-16e-instruct",
  web: "groq/compound",
  fast: "llama-3.3-70b-versatile",
} as const;

export const CONTROLLER_V2_PLANNER_PROMPT = `Understand the user deeply.
Decide what is needed.
You can:
- solve directly
- or request extra reasoning
- or request web

Return only valid JSON in this format:
{
  "mode": "direct | reasoning | web",
  "confidence": 0-1
}`;

export const CONTROLLER_V2_FINAL_PROMPT = `Write the final answer in a clean, structured, human style.
Keep one-brain feel.
Do not mention hidden helpers, internal tools, routing, or model switching.`;

export const parseControllerV2Decision = (
  raw: string
): ControllerV2PlannerDecision => {
  const source = (raw || "").trim();

  const tryParse = (value: string): ControllerV2PlannerDecision | null => {
    try {
      const parsed = JSON.parse(value || "{}");

      const mode: ControllerMode =
        parsed?.mode === "reasoning" || parsed?.mode === "web"
          ? parsed.mode
          : "direct";

      const rawConfidence =
        typeof parsed?.confidence === "number" ? parsed.confidence : 0;

      const confidence = Math.max(0, Math.min(1, rawConfidence));

      return { mode, confidence };
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

  return { mode: "direct", confidence: 0 };
};

export const buildControllerV2PlannerMessages = (
  input: ControllerV2Input
) => {
  const contextParts = [
    `User prompt:\n${input.prompt || ""}`,
    input.imageContext ? `Image context:\n${input.imageContext}` : "",
  ].filter(Boolean);

  return [
    {
      role: "system",
      content: CONTROLLER_V2_PLANNER_PROMPT,
    },
    ...(input.systemInstruction?.trim()
      ? [
          {
            role: "system",
            content: input.systemInstruction.trim(),
          },
        ]
      : []),
    ...input.messages,
    {
      role: "user",
      content: contextParts.join("\n\n"),
    },
  ];
};

export const buildControllerV2HelperPrompt = (
  mode: Exclude<ControllerMode, "direct">,
  input: ControllerV2Input
) => {
  const imageBlock = input.imageContext?.trim()
    ? `Image context:\n${input.imageContext.trim()}\n\n`
    : "";

  if (mode === "reasoning") {
    return `${imageBlock}Solve the user's request carefully and deeply.
Return only the useful solution content.
Do not mention tools, hidden routing, or internal system details.

User request:
${input.prompt}`;
  }

  return `${imageBlock}Find the latest relevant web-backed information for the user's request.
Return only the useful answer content with concise source-aware support.
Do not mention tools, hidden routing, or internal system details.

User request:
${input.prompt}`;
};

export const buildControllerV2FinalMessages = (
  input: ControllerV2Input,
  helperOutput: string
) => {
  const helperBlock = helperOutput.trim()
    ? `Hidden helper result:\n${helperOutput.trim()}`
    : "No helper result.";

  const imageBlock = input.imageContext?.trim()
    ? `Image context:\n${input.imageContext.trim()}`
    : "";

  return [
    {
      role: "system",
      content: CONTROLLER_V2_FINAL_PROMPT,
    },
    ...(input.systemInstruction?.trim()
      ? [
          {
            role: "system",
            content: input.systemInstruction.trim(),
          },
        ]
      : []),
    ...input.messages,
    {
      role: "user",
      content: [
        `User request:\n${input.prompt || ""}`,
        imageBlock,
        helperBlock,
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
    mode: "direct",
    confidence: 0,
    imageContext: input.imageContext || "",
    helperOutput: "",
    finalText: "",
    reason: "controller_v2_not_implemented",
  };
};
