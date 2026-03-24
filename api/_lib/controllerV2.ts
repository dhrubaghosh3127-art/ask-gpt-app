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

export const CONTROLLER_V2_PLAN_PROMPT = `You are the main routing planner for a multi-stage assistant.

Your only job is to classify the user's request and return ONLY one minified JSON object.

DO NOT:
- explain anything
- chat with the user
- restate the conversation
- summarize history
- add markdown
- add code fences
- add any text before or after JSON

Use:
- the current user request
- recent chat history
- hidden image context if present

Return exactly this schema:
{
  "needs_reasoning": true,
  "needs_web": true,
  "is_simple": false,
  "search_mode": "pro",
  "is_math": false,
  "reasoning_scope": "open",
  "confidence": 0.84
}

Field meaning:
- needs_reasoning: deep solving / analysis / proof / multi-step logic is needed
- needs_web: web/current/external information is needed
- is_simple: very simple direct non-web request
- search_mode:
  - "none" = no web
  - "fast" = one quick factual/current web pass
  - "pro" = main search + support search
- is_math: any math / proof / theorem / formula / equation / olympiad / quantitative reasoning
- reasoning_scope:
  - "none" = no deep reasoning needed
  - "closed" = deep reasoning only, no external info needed
  - "open" = deep reasoning plus external hints/context/examples/current info useful

Locked rules:
- Any math / proof / theorem / formula / equation / olympiad / geometry / algebra / inequality / trig / calculus / integral / derivative / sum => is_math=true, needs_reasoning=true, needs_web=true, search_mode="pro"
- Any current/news/latest/today/date/time/live/recent/fresh info => needs_web=true
- If current/factual but not hard reasoning => search_mode="fast"
- If hard reasoning with external context/comparison/examples needed => needs_reasoning=true, needs_web=true, reasoning_scope="open", search_mode="pro"
- If hard reasoning but external info not needed => needs_reasoning=true, reasoning_scope="closed"
- Very simple greeting / tiny direct request with no web and no deep reasoning => is_simple=true, needs_reasoning=false, needs_web=false, search_mode="none", reasoning_scope="none"

Important:
- Prefer "pro" for any math.
- Prefer "fast" for date/news/current simple factual requests.
- confidence must be a number from 0 to 1.
- Return ONLY minified JSON.`;

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
  const compactHistory = (input.messages || [])
    .slice(-8)
    .map((msg: any, index: number) => {
      const role =
        msg?.role === "assistant" || msg?.role === "model"
          ? "assistant"
          : msg?.role === "system"
            ? "system"
            : "user";

      const content =
        typeof msg?.content === "string"
          ? msg.content.trim()
          : Array.isArray(msg?.content)
            ? msg.content
                .map((part: any) =>
                  typeof part === "string"
                    ? part
                    : typeof part?.text === "string"
                      ? part.text
                      : typeof part?.content === "string"
                        ? part.content
                        : ""
                )
                .join(" ")
                .trim()
            : "";

      return `${index + 1}. ${role}: ${(content || "").slice(0, 400)}`;
    })
    .filter(Boolean)
    .join("\n");

  const plannerInput = [
    "Classify the current request.",
    `Current user request:\n${(input.prompt || "").trim()}`,
    input.imageContext?.trim()
      ? `Hidden image context:\n${input.imageContext.trim()}`
      : "",
    compactHistory ? `Recent compact history:\n${compactHistory}` : "",
    "Return ONLY minified JSON.",
  ]
    .filter(Boolean)
    .join("\n\n");

  return [
  {
    role: "system",
    content: CONTROLLER_V2_PLAN_PROMPT,
  },
  {
    role: "user",
    content: plannerInput,
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
  const cleanHistory = (input.messages || []).filter((msg: any) => {
    const text =
      typeof msg?.content === "string"
        ? msg.content
        : Array.isArray(msg?.content)
        ? msg.content
            .map((part: any) =>
              typeof part === "string"
                ? part
                : typeof part?.text === "string"
                ? part.text
                : typeof part?.content === "string"
                ? part.content
                : ""
            )
            .join(" ")
        : "";

    return !/\[Trace\]|\[Debug plan\]|\[Debug plannerRaw\]|\[Debug used\]/.test(
      text
    );
  });

  const isSimpleDirect =
    !searchExtract.trim() &&
    !webOutput.trim() &&
    !reasoningOutput.trim() &&
    !verifyOutput.trim() &&
    !refinedOutput.trim();

  if (isSimpleDirect) {
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
  content: `You are an advanced, highly intelligent, emotionally aware AI assistant.

Your main goal is to produce the most natural, human-like, and helpful responses possible — just like a smart, friendly person.

========================
LANGUAGE & STYLE
========================
- Always reply in the user's language.
- Match the user's tone and style:
  - Casual → casual
  - Formal → formal
  - Banglish → Banglish
  - Bengali → Bengali
  - English → English

- Your response must feel like real human conversation:
  - Smooth
  - Natural
  - Not robotic
  - Not overly formal

========================
CORE BEHAVIOR
========================
1. First understand the user's real intent (not just words).
2. Then respond clearly, simply, and helpfully.
3. Avoid unnecessary complexity.
4. Be confident but not arrogant.
5. Never mention you are an AI.

========================
RESPONSE QUALITY
========================
- Always aim for:
  ✔ clarity  
  ✔ usefulness  
  ✔ natural tone  

- Structure when needed:
  - Short paragraphs
  - Bullet points (if helpful)
  - Step-by-step (for complex tasks)

- Do NOT over-explain simple things.
- Do NOT under-explain complex things.

========================
HUMAN-LIKE TOUCH
========================
- Occasionally use light emojis (not too many).
- Add a soft conversational ending sometimes, such as:
  - "Chaile ami eta aro simple kore bujhai dite pari 🙂"
  - "Bollei ami step-by-step kore debo"
  - "Jodi kono part clear na hoy, bolo"

- Vary your endings (do not repeat same line every time).

========================
ADAPTIVE INTELLIGENCE
========================
- If user is confused → explain simpler
- If user is advanced → go deeper
- If user is emotional → be supportive
- If user asks directly → answer directly

========================
FOLLOW-UP BEHAVIOR
========================
- If user message is unclear → ask a short clarification question
- If answer can be improved → optionally offer help

========================
STRICT RULES
========================
- Never say:
  ❌ "As an AI..."
  ❌ robotic phrases
  ❌ overly generic answers

- Never sound like a textbook.
- Never ignore user tone.

========================
FINAL OUTPUT STYLE
========================
Your response should feel like:
👉 a smart friend  
👉 who explains clearly  
👉 and talks naturally  

NOT like a machine.`,
},
    {
  role: "user",
  content: [
    input.imageContext?.trim()
      ? `Hidden image context:\n${input.imageContext.trim()}`
      : "",
    fastOutput.trim() || (input.prompt || "").trim(),
  ]
    .filter(Boolean)
    .join("\n\n"),
},
    ];
  }
if (isSimpleDirect) {
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
      content: [
        CONTROLLER_V2_FINAL_PROMPT,
        "For simple chat, greeting, casual talk, or everyday questions:",
        "- answer directly and naturally",
        "- use the user's language and tone",
        "- do not analyze the wording",
        "- do not explain what language the user used",
        "- do not mention internal reasoning",
        "- output only the final user-facing reply",
        "- use the fast draft as the base answer and only polish lightly",
      ].join("\n"),
    },
    {
      role: "user",
      content: [
        input.imageContext?.trim()
          ? `Hidden image context:\n${input.imageContext.trim()}`
          : "",
        (fastOutput || "").trim() || (input.prompt || "").trim(),
      ]
        .filter(Boolean)
        .join("\n\n"),
    },
  ];
}
  
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
