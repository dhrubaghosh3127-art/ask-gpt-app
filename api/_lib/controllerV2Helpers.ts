import {
  CONTROLLER_V2_MODELS,
  ControllerV2Input,
  buildControllerV2FastPrompt,
  buildControllerV2FastWebPrompt,
  buildControllerV2MainSearchPrompt,
  buildControllerV2SupportSearchPrompt,
  buildControllerV2ReasoningPrompt,
} from "./controllerV2.js";
import { callControllerV2Model } from "./controllerV2Api.js";
import {
  extractControllerV2MessageText,
  isControllerV2Empty,
} from "./controllerV2Runtime.js";

export interface ControllerV2HelperCallResult {
  ok: boolean;
  text: string;
  rawText?: string;
  error?: string;
  mainSearchOutput?: string;
  supportSearchOutput?: string;
  searchExtract?: string;
}

export type ControllerV2WebMode = "fast" | "pro";

const splitCandidateLines = (text: string): string[] => {
  return (text || "")
    .split(/\r?\n+/)
    .map((line) =>
      line
        .replace(/^[\-\*\d\.\)\]]+\s*/, "")
        .replace(/^✅\s*/, "")
        .replace(/^✔️\s*/, "")
        .trim()
    )
    .filter(Boolean);
};

const scoreSearchLine = (line: string): number => {
  const t = line.toLowerCase();
  let score = 0;

  if (
    /theorem|formula|hint|pattern|proof|idea|concept|fact|lemma|identity|structure|strategy|technique|rule|উপপাদ্য|সূত্র|ইঙ্গিত|ধারা|প্রমাণ|ধারণা/.test(
      t
    )
  ) {
    score += 3;
  }

  if (
    /copy|copied|full answer|full webpage|complete solution|entire proof/.test(t)
  ) {
    score -= 5;
  }

  if (line.length >= 30 && line.length <= 220) {
    score += 1;
  }

  return score;
};

const extractUsefulSearchSupport = (
  mainSearchOutput: string,
  supportSearchOutput: string
): string => {
  const seen = new Set<string>();

  const lines = [...splitCandidateLines(mainSearchOutput), ...splitCandidateLines(supportSearchOutput)]
    .filter((line) => {
      const key = line.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((line) => ({ line, score: scoreSearchLine(line) }))
    .sort((a, b) => b.score - a.score);

  const best = lines
    .filter((item) => item.score >= 1)
    .slice(0, 3)
    .map((item) => item.line);

  if (best.length > 0) {
    return best.map((line, i) => `${i + 1}. ${line}`).join("\n");
  }

  const fallback = lines
    .slice(0, 3)
    .map((item) => item.line);

  return fallback.map((line, i) => `${i + 1}. ${line}`).join("\n");
};

export const runControllerV2WebHelper = async (
  apiKey: string,
  input: ControllerV2Input,
  mode: ControllerV2WebMode = "pro"
): Promise<ControllerV2HelperCallResult> => {
  if (mode === "fast") {
    const response = await callControllerV2Model({
      apiKey,
      model: CONTROLLER_V2_MODELS.webMain,
      messages: [
        {
          role: "user",
          content: buildControllerV2FastWebPrompt(input),
        },
      ],
      temperature: 0.2,
      maxCompletionTokens: 1200,
    });

    if (!response.ok) {
      return {
        ok: false,
        text: "",
        error: response.error || "fast_web_failed",
      };
    }

    const text = extractControllerV2MessageText(response.data);

    if (isControllerV2Empty(text)) {
      return {
        ok: false,
        text: "",
        error: "fast_web_empty",
      };
    }

    return {
      ok: true,
      text,
      rawText: text,
      mainSearchOutput: text,
      supportSearchOutput: "",
      searchExtract: text,
    };
  }

  const mainResponse = await callControllerV2Model({
    apiKey,
    model: CONTROLLER_V2_MODELS.webMain,
    messages: [
      {
        role: "user",
        content: buildControllerV2MainSearchPrompt(input),
      },
    ],
    temperature: 0.2,
    maxCompletionTokens: 1600,
  });

  if (!mainResponse.ok) {
    return {
      ok: false,
      text: "",
      error: mainResponse.error || "pro_search_main_failed",
    };
  }

  const mainSearchOutput = extractControllerV2MessageText(mainResponse.data);

  if (isControllerV2Empty(mainSearchOutput)) {
    return {
      ok: false,
      text: "",
      error: "pro_search_main_empty",
    };
  }

  const supportResponse = await callControllerV2Model({
    apiKey,
    model: CONTROLLER_V2_MODELS.webSupport,
    messages: [
      {
        role: "user",
        content: buildControllerV2SupportSearchPrompt(
          input,
          mainSearchOutput
        ),
      },
    ],
    temperature: 0.2,
    maxCompletionTokens: 1000,
  });

  if (!supportResponse.ok) {
    return {
      ok: false,
      text: "",
      mainSearchOutput,
      supportSearchOutput: "",
      error: supportResponse.error || "pro_search_support_failed",
    };
  }

  const supportSearchOutput = extractControllerV2MessageText(
    supportResponse.data
  );

  if (isControllerV2Empty(supportSearchOutput)) {
    return {
      ok: false,
      text: "",
      mainSearchOutput,
      supportSearchOutput: "",
      error: "pro_search_support_empty",
    };
  }

  const searchExtract = extractUsefulSearchSupport(
    mainSearchOutput,
    supportSearchOutput
  );

  return {
    ok: true,
    text: searchExtract,
    rawText: [mainSearchOutput, supportSearchOutput].filter(Boolean).join("\n\n"),
    mainSearchOutput,
    supportSearchOutput,
    searchExtract,
  };
};

export const runControllerV2ReasoningHelper = async (
  apiKey: string,
  input: ControllerV2Input,
  searchExtract: string = ""
): Promise<ControllerV2HelperCallResult> => {
  const response = await callControllerV2Model({
    apiKey,
    model: CONTROLLER_V2_MODELS.reasoning,
    messages: [
      {
        role: "user",
        content: buildControllerV2ReasoningPrompt(input, searchExtract),
      },
    ],
    temperature: 0.2,
    maxCompletionTokens: 3000,
    reasoningEffort: "default",
    reasoningFormat: "hidden",
  });

  if (!response.ok) {
    return {
      ok: false,
      text: "",
      error: response.error || "reasoning_helper_failed",
    };
  }

  const text = extractControllerV2MessageText(response.data);

  if (isControllerV2Empty(text)) {
    return {
      ok: false,
      text: "",
      error: "reasoning_helper_empty",
    };
  }

  return {
    ok: true,
    text,
    rawText: text,
  };
};

export const runControllerV2FastHelper = async (
  apiKey: string,
  input: ControllerV2Input
): Promise<ControllerV2HelperCallResult> => {
  const response = await callControllerV2Model({
    apiKey,
    model: CONTROLLER_V2_MODELS.fast,
    messages: [
      {
        role: "user",
        content: buildControllerV2FastPrompt(input),
      },
    ],
    temperature: 0.3,
    maxCompletionTokens: 900,
  });

  if (!response.ok) {
    return {
      ok: false,
      text: "",
      error: response.error || "fast_helper_failed",
    };
  }

  const text = extractControllerV2MessageText(response.data);

  if (isControllerV2Empty(text)) {
    return {
      ok: false,
      text: "",
      error: "fast_helper_empty",
    };
  }

  return {
    ok: true,
    text,
    rawText: text,
  };
};
