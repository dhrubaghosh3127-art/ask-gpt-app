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
  search_mode: "none" | "fast" | "pro";
  is_math: boolean;
  reasoning_scope: "none" | "closed" | "open";
  confidence: number;
}

export interface ControllerV2Result {
  ok: boolean;
  plan: ControllerV2Plan;
  imageContext: string;
  plannerRaw: string;
  mainSearchOutput: string;
  supportSearchOutput: string;
  searchExtract: string;
  webOutput: string;
  reasoningOutput: string;
  verifyOutput: string;
  fastOutput: string;
  refinedOutput: string;
  finalText: string;
  reason?: string;
}

export const CONTROLLER_V2_MODELS = {
  planner: "openai/gpt-oss-120b",
  final: "openai/gpt-oss-120b",
  verifier: "openai/gpt-oss-120b",
  refiner: "openai/gpt-oss-120b",
  reasoning: "qwen/qwen3-32b",
  image: "meta-llama/llama-4-scout-17b-16e-instruct",
  webMain: "groq/compound",
  webSupport: "groq/compound-mini",
  fast: "llama-3.3-70b-versatile",
} as const;

export const CONTROLLER_V2_PLAN_PROMPT = `You are the main planner.
Understand the user's request deeply using:
- the user prompt
- recent chat history
- hidden image context if present

Return ONLY valid JSON.

Schema:
{
  "needs_reasoning": true/false,
  "needs_web": true/false,
  "is_simple": true/false,
  "search_mode": "none" | "fast" | "pro",
  "is_math": true/false,
  "reasoning_scope": "none" | "closed" | "open",
  "confidence": 0-1
}

Rules:
- is_math = true for math / proof / formula / equation / olympiad-style quantitative reasoning
- reasoning_scope = "closed" when external info is not needed
- reasoning_scope = "open" when external hints/context/examples/current facts are useful
- if is_math = true, search_mode should normally be "pro"
- if latest/current/news/factual web info is needed, needs_web = true
- if very simple non-web request, is_simple = true
- output JSON only, no markdown, no explanation`;

export const CONTROLLER_V2_SEARCH_EXTRACT_PROMPT = `You are extracting only useful support from search results.
Never copy the full answer.
Never return full webpages.
Return only concise useful items such as:
- theorem
- formula
- hint
- pattern
- proof structure
- relevant fact/context

Keep it short.
Maximum 2-3 useful extracts.`;

export const CONTROLLER_V2_FAST_WEB_PROMPT = `Do one fast web pass for the user's request.
Return only concise relevant factual info.
Do not mention tools, routing, or internal details.`;

export const CONTROLLER_V2_PRO_SEARCH_MAIN_PROMPT = `Run the main pro-search.
Focus on:
- the exact question/topic
- direct relevant result
- exact problem/topic match
Return only concise useful findings, not full webpages or copied answers.`;

export const CONTROLLER_V2_PRO_SEARCH_SUPPORT_PROMPT = `Run the support pro-search.
Focus on:
- similar problem
- theorem
- proof idea
- formula
- pattern
- related concept
- comparison/context
Return only concise useful findings, not full webpages or copied answers.`;

export const CONTROLLER_V2_MATH_REASONING_PROMPT = `Use the provided hints/theorems/formulas/patterns to solve the math problem.
Do not copy any full answer from search.
Reason carefully and produce a useful solution draft.
If proof is needed, provide a proof-oriented draft.
Do not mention tools, routing, or internal system details.`;

export const CONTROLLER_V2_NON_MATH_REASONING_PROMPT = `Use the provided context/hints to solve the user's hard reasoning request.
Do not copy any full answer from search.
Reason carefully and produce a useful solution draft.
Do not mention tools, routing, or internal system details.`;

export const CONTROLLER_V2_VERIFY_PROMPT = `You are verifying the reasoning result.
Check:
- theorem/formula use is correct or not
- logical gap exists or not
- calculation mismatch exists or not
- proof incomplete or not
- final result matches the actual question or not

Return a concise verifier result.
If strong, say it is strong and why.
If weak, clearly say what is weak or missing.
Do not mention tools or internal system details.`;

export const CONTROLLER_V2_REFINE_PROMPT = `You are refining hidden intermediate results into a stronger internal draft.
Merge useful parts.
Resolve conflicts.
If something is weak or unclear, improve it once.
Do not mention hidden helpers, tools, routing, or model switching.`;

export const CONTROLLER_V2_FINAL_PROMPT = `Write the final answer in a clean, structured, human-like way.
Keep a one-brain feel.
Do not mention hidden helpers, tools, routing, or model switching.
If the answer is uncertain or incomplete, say so honestly instead of pretending certainty.`;

export const DEFAULT_CONTROLLER_V2_PLAN: ControllerV2Plan = {
  needs_reasoning: false,
  needs_web: false,
  is_simple: false,
  search_mode: "none",
  is_math: false,
  reasoning_scope: "none",
  confidence: 0,
};

export const parseControllerV2Plan = (raw: string): ControllerV2Plan => {
  const source = (raw || "").trim();

  const normalize = (parsed: any): ControllerV2Plan => {
    const searchMode =
      parsed?.search_mode === "fast" || parsed?.search_mode === "pro"
        ? parsed.search_mode
        : "none";

    const reasoningScope =
      parsed?.reasoning_scope === "closed" || parsed?.reasoning_scope === "open"
        ? parsed.reasoning_scope
        : "none";

    const confidence =
      typeof parsed?.confidence === "number"
        ? Math.max(0, Math.min(1, parsed.confidence))
        : 0;

    return {
      needs_reasoning: Boolean(parsed?.needs_reasoning),
      needs_web: Boolean(parsed?.needs_web),
      is_simple: Boolean(parsed?.is_simple),
      search_mode: searchMode,
      is_math: Boolean(parsed?.is_math),
      reasoning_scope: reasoningScope,
      confidence,
    };
  };

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
      ? `Hidden image context:\n${input.imageContext.trim()}`
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

export const buildControllerV2FastWebPrompt = (
  input: ControllerV2Input
): string => {
  return [
    CONTROLLER_V2_FAST_WEB_PROMPT,
    input.imageContext?.trim()
      ? `Hidden image context:\n${input.imageContext.trim()}`
      : "",
    `User request:\n${input.prompt}`,
  ]
    .filter(Boolean)
    .join("\n\n");
};

export const buildControllerV2MainSearchPrompt = (
  input: ControllerV2Input
): string => {
  return [
    CONTROLLER_V2_PRO_SEARCH_MAIN_PROMPT,
    input.imageContext?.trim()
      ? `Hidden image context:\n${input.imageContext.trim()}`
      : "",
    `User request:\n${input.prompt}`,
  ]
    .filter(Boolean)
    .join("\n\n");
};

export const buildControllerV2SupportSearchPrompt = (
  input: ControllerV2Input,
  mainSearchOutput: string
): string => {
  return [
    CONTROLLER_V2_PRO_SEARCH_SUPPORT_PROMPT,
    input.imageContext?.trim()
      ? `Hidden image context:\n${input.imageContext.trim()}`
      : "",
    mainSearchOutput.trim()
      ? `Main search result:\n${mainSearchOutput.trim()}`
      : "",
    `User request:\n${input.prompt}`,
  ]
    .filter(Boolean)
    .join("\n\n");
};

export const buildControllerV2SearchExtractPrompt = (
  input: ControllerV2Input,
  mainSearchOutput: string,
  supportSearchOutput: string
): string => {
  return [
    CONTROLLER_V2_SEARCH_EXTRACT_PROMPT,
    input.imageContext?.trim()
      ? `Hidden image context:\n${input.imageContext.trim()}`
      : "",
    mainSearchOutput.trim()
      ? `Main search result:\n${mainSearchOutput.trim()}`
      : "",
    supportSearchOutput.trim()
      ? `Support search result:\n${supportSearchOutput.trim()}`
      : "",
    `User request:\n${input.prompt}`,
  ]
    .filter(Boolean)
    .join("\n\n");
};

export const buildControllerV2ReasoningPrompt = (
  input: ControllerV2Input,
  searchExtract: string
): string => {
  const basePrompt = input.prompt || "";

  if (searchExtract.trim()) {
    return [
      input.imageContext?.trim()
        ? `Hidden image context:\n${input.imageContext.trim()}`
        : "",
      inputHasMathLikeNeed(basePrompt)
        ? CONTROLLER_V2_MATH_REASONING_PROMPT
        : CONTROLLER_V2_NON_MATH_REASONING_PROMPT,
      `Useful extracted support:\n${searchExtract.trim()}`,
      `User request:\n${basePrompt}`,
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  return [
    input.imageContext?.trim()
      ? `Hidden image context:\n${input.imageContext.trim()}`
      : "",
    inputHasMathLikeNeed(basePrompt)
      ? CONTROLLER_V2_MATH_REASONING_PROMPT
      : CONTROLLER_V2_NON_MATH_REASONING_PROMPT,
    `User request:\n${basePrompt}`,
  ]
    .filter(Boolean)
    .join("\n\n");
};

export const buildControllerV2FastPrompt = (
  input: ControllerV2Input
): string => {
  return [
    input.imageContext?.trim()
      ? `Hidden image context:\n${input.imageContext.trim()}`
      : "",
    `Create a fast useful draft answer.
Keep it short and direct.
Do not mention tools, routing, or internal system details.

User request:
${input.prompt}`,
  ]
    .filter(Boolean)
    .join("\n\n");
};

export const buildControllerV2VerifyMessages = (
  input: ControllerV2Input,
  reasoningOutput: string,
  searchExtract: string
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
      content: CONTROLLER_V2_VERIFY_PROMPT,
    },
    ...input.messages,
    {
      role: "user",
      content: [
        `User request:\n${input.prompt || ""}`,
        input.imageContext?.trim()
          ? `Hidden image context:\n${input.imageContext.trim()}`
          : "",
        searchExtract.trim()
          ? `Useful extracted support:\n${searchExtract.trim()}`
          : "",
        reasoningOutput.trim()
          ? `Reasoning result:\n${reasoningOutput.trim()}`
          : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
  ];
};

export const buildControllerV2RefineMessages = (
  input: ControllerV2Input,
  searchExtract: string,
  webOutput: string,
  reasoningOutput: string,
  fastOutput: string,
  verifyOutput: string
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
          ? `Hidden image context:\n${input.imageContext.trim()}`
          : "",
        searchExtract.trim()
          ? `Useful extracted support:\n${searchExtract.trim()}`
          : "",
        webOutput.trim() ? `Web result:\n${webOutput.trim()}` : "",
        reasoningOutput.trim()
          ? `Reasoning result:\n${reasoningOutput.trim()}`
          : "",
        fastOutput.trim() ? `Fast draft:\n${fastOutput.trim()}` : "",
        verifyOutput.trim() ? `Verifier result:\n${verifyOutput.trim()}` : "",
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
  ];
};

export const buildControllerV2FinalMessages = (
  input: ControllerV2Input,
  searchExtract: string,
  webOutput: string,
  reasoningOutput: string,
  fastOutput: string,
  verifyOutput: string,
  refinedOutput: string
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
          ? `Hidden image context:\n${input.imageContext.trim()}`
          : "",
        searchExtract.trim()
          ? `Useful extracted support:\n${searchExtract.trim()}`
          : "",
        webOutput.trim() ? `Web result:\n${webOutput.trim()}` : "",
        reasoningOutput.trim()
          ? `Reasoning result:\n${reasoningOutput.trim()}`
          : "",
        fastOutput.trim() ? `Fast draft:\n${fastOutput.trim()}` : "",
        verifyOutput.trim() ? `Verifier result:\n${verifyOutput.trim()}` : "",
        refinedOutput.trim()
          ? `Refined internal draft:\n${refinedOutput.trim()}`
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
    plannerRaw: "",
    mainSearchOutput: "",
    supportSearchOutput: "",
    searchExtract: "",
    webOutput: "",
    reasoningOutput: "",
    verifyOutput: "",
    fastOutput: "",
    refinedOutput: "",
    finalText: "",
    reason: "controller_v2_not_implemented",
  };
};

const inputHasMathLikeNeed = (prompt: string): boolean => {
  const t = (prompt || "").toLowerCase();
  return /prove|proof|theorem|equation|integral|derivative|sum|geometry|triangle|circle|algebra|inequality|olympiad|lemma|corollary|matrix|vector|log|limit|sin|cos|tan|π|sqrt|∫|∑|≤|≥|বাংলা|প্রমাণ|উপপাদ্য|সমীকরণ|ত্রিভুজ|বৃত্ত|জ্যামিতি|বীজগণিত|অসমতা/.test(
    t
  );
};  
