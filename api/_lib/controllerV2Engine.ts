import {
  ControllerV2Input,
  ControllerV2Result,
  DEFAULT_CONTROLLER_V2_PLAN,
} from "./controllerV2.js";
import { analyzeControllerV2Image } from "./controllerV2Image.js";
import { runControllerV2Planner } from "./controllerV2Planner.js";
import {
  runControllerV2WebHelper,
  runControllerV2ReasoningHelper,
  runControllerV2FastHelper,
} from "./controllerV2Helpers.js";
import {
  runControllerV2Verify,
  runControllerV2Refine,
  runControllerV2Final,
} from "./controllerV2Finalize.js";

export interface ControllerV2EngineInput extends ControllerV2Input {
  apiKey: string;
  imageBase64?: string;
  mimeType?: string;
}

const isWeakVerifierOutput = (text: string): boolean => {
  const t = (text || "").toLowerCase();

  if (!t.trim()) return true;

  return /weak|unclear|incomplete|gap|mismatch|missing|not enough|wrong|issue|problem|uncertain|দুর্বল|অসম্পূর্ণ|ফাঁক|ভুল|অস্পষ্ট|মিলছে না/.test(
    t
  );
};

const buildRetryInput = (
  input: ControllerV2Input,
  searchExtract: string,
  reasoningOutput: string,
  verifyOutput: string
): ControllerV2Input => {
  return {
    ...input,
    prompt: [
      input.prompt || "",
      searchExtract.trim() ? `Useful support:\n${searchExtract.trim()}` : "",
      reasoningOutput.trim()
        ? `Previous reasoning draft:\n${reasoningOutput.trim()}`
        : "",
      verifyOutput.trim()
        ? `Verifier said to improve:\n${verifyOutput.trim()}`
        : "",
      "Retry narrowly. Focus only on the weak/missing part and improve the result.",
    ]
      .filter(Boolean)
      .join("\n\n"),
  };
};

export const runControllerV2Engine = async (
  input: ControllerV2EngineInput
): Promise<ControllerV2Result> => {
  let imageContext = input.imageContext?.trim() || "";
  let plannerRaw = "";
  let plan = DEFAULT_CONTROLLER_V2_PLAN;

  let mainSearchOutput = "";
  let supportSearchOutput = "";
  let searchExtract = "";
  let webOutput = "";
  let reasoningOutput = "";
  let verifyOutput = "";
  let fastOutput = "";
  let refinedOutput = "";
  let finalText = "";

  if (input.hasImage && input.imageBase64?.trim()) {
    const imageResult = await analyzeControllerV2Image({
      apiKey: input.apiKey,
      imageBase64: input.imageBase64,
      mimeType: input.mimeType || "image/jpeg",
      userPrompt: input.prompt || "",
    });

    if (imageResult.ok && imageResult.text.trim()) {
      imageContext = imageResult.text.trim();
    }
  }

  const plannerResult = await runControllerV2Planner(input.apiKey, {
    ...input,
    imageContext,
  });

  if (plannerResult.ok) {
    plan = plannerResult.plan;
    plannerRaw = plannerResult.rawText || "";
  } else {
    plannerRaw = plannerResult.rawText || "";
  }

  const workingInput: ControllerV2Input = {
    ...input,
    imageContext,
  };

  // 1) Very simple non-web path
if (
  plan.is_simple &&
  !plan.needs_reasoning &&
  !plan.needs_web &&
  plan.search_mode === "none"
) {
  const fastResult = await runControllerV2FastHelper(input.apiKey, workingInput);

  if (fastResult.ok && fastResult.text.trim()) {
    fastOutput = fastResult.text.trim();
    finalText = fastOutput;

    return {
      ok: true,
      plan,
      imageContext,
      plannerRaw,
      mainSearchOutput,
      supportSearchOutput,
      searchExtract,
      webOutput,
      reasoningOutput,
      verifyOutput,
      fastOutput,
      refinedOutput,
      finalText,
      reason: "",
    };
  }
  }

  // 2) Fast web path (non-math, no reasoning)
  if (
    plan.needs_web &&
    plan.search_mode === "fast" &&
    !plan.is_math &&
    !plan.needs_reasoning
  ) {
    const webResult = await runControllerV2WebHelper(
      input.apiKey,
      workingInput,
      "fast"
    );

    if (webResult.ok) {
      webOutput = webResult.text.trim();
      mainSearchOutput = webResult.mainSearchOutput?.trim() || webOutput;
      supportSearchOutput = webResult.supportSearchOutput?.trim() || "";
      searchExtract = webResult.searchExtract?.trim() || webOutput;
    }
  }

  // 3) Pro-search path
  const shouldRunProSearch =
    plan.search_mode === "pro" ||
    plan.is_math ||
    (plan.needs_reasoning &&
      !plan.is_math &&
      plan.reasoning_scope === "open");

  if (shouldRunProSearch) {
    const proSearchResult = await runControllerV2WebHelper(
      input.apiKey,
      workingInput,
      "pro"
    );

    if (proSearchResult.ok) {
      mainSearchOutput = proSearchResult.mainSearchOutput?.trim() || "";
      supportSearchOutput = proSearchResult.supportSearchOutput?.trim() || "";
      searchExtract = proSearchResult.searchExtract?.trim() || "";
      webOutput = searchExtract || proSearchResult.text.trim();
    } else {
      if (!mainSearchOutput) {
        mainSearchOutput = proSearchResult.mainSearchOutput?.trim() || "";
      }
      if (!supportSearchOutput) {
        supportSearchOutput = proSearchResult.supportSearchOutput?.trim() || "";
      }
    }
  }

  // 4) Math rule: always pro-search first -> qwen -> GPT verify -> one retry max
if (plan.is_math) {
  let mathContext = [
    searchExtract,
    supportSearchOutput,
    mainSearchOutput,
    webOutput,
  ]
    .filter(Boolean)
    .join("\n\n")
    .trim();

  const reasoningResult = await runControllerV2ReasoningHelper(
    input.apiKey,
    workingInput,
    mathContext
  );

  if (reasoningResult.ok && reasoningResult.text.trim()) {
    reasoningOutput = reasoningResult.text.trim();
  }

  if (reasoningOutput) {
    const verifyResult = await runControllerV2Verify(
      input.apiKey,
      workingInput,
      reasoningOutput,
      mathContext
    );

    if (verifyResult.ok && verifyResult.text.trim()) {
      verifyOutput = verifyResult.text.trim();
    }
  }

  const shouldRetryMath =
    !reasoningOutput || isWeakVerifierOutput(verifyOutput);

  if (shouldRetryMath) {
    const retryInput = buildRetryInput(
      workingInput,
      mathContext,
      reasoningOutput,
      verifyOutput
    );

    const retrySearchResult = await runControllerV2WebHelper(
      input.apiKey,
      retryInput,
      "pro"
    );

    if (retrySearchResult.ok) {
      const retryExtract = [
        retrySearchResult.searchExtract?.trim() || "",
        retrySearchResult.supportSearchOutput?.trim() || "",
        retrySearchResult.mainSearchOutput?.trim() || "",
        retrySearchResult.text?.trim() || "",
      ]
        .filter(Boolean)
        .join("\n\n")
        .trim();

      mathContext = [mathContext, retryExtract]
        .filter(Boolean)
        .join("\n\n")
        .trim();

      if (retrySearchResult.mainSearchOutput?.trim()) {
        mainSearchOutput = retrySearchResult.mainSearchOutput.trim();
      }

      if (retrySearchResult.supportSearchOutput?.trim()) {
        supportSearchOutput = retrySearchResult.supportSearchOutput.trim();
      }

      searchExtract = mathContext;
      webOutput = mathContext || retrySearchResult.text.trim();
    }

    const retryReasoningResult = await runControllerV2ReasoningHelper(
      input.apiKey,
      retryInput,
      mathContext
    );

    if (retryReasoningResult.ok && retryReasoningResult.text.trim()) {
      reasoningOutput = retryReasoningResult.text.trim();
    }

    if (reasoningOutput) {
      const retryVerifyResult = await runControllerV2Verify(
        input.apiKey,
        workingInput,
        reasoningOutput,
        mathContext
      );

      if (retryVerifyResult.ok && retryVerifyResult.text.trim()) {
        verifyOutput = retryVerifyResult.text.trim();
      }
    }
  }
        }

  // 5) Non-math hard reasoning
  if (plan.needs_reasoning && !plan.is_math) {
    const reasoningResult = await runControllerV2ReasoningHelper(
      input.apiKey,
      workingInput,
      searchExtract
    );

    if (reasoningResult.ok) {
      reasoningOutput = reasoningResult.text.trim();
    }

    if (reasoningOutput) {
      const verifyResult = await runControllerV2Verify(
        input.apiKey,
        workingInput,
        reasoningOutput,
        searchExtract
      );

      if (verifyResult.ok) {
        verifyOutput = verifyResult.text.trim();
      }
    }

    const shouldRetryOpenReasoning =
      plan.reasoning_scope === "open" &&
      reasoningOutput &&
      isWeakVerifierOutput(verifyOutput);

    if (shouldRetryOpenReasoning) {
      const retryInput = buildRetryInput(
        workingInput,
        searchExtract,
        reasoningOutput,
        verifyOutput
      );

      const retrySearchResult = await runControllerV2WebHelper(
        input.apiKey,
        retryInput,
        "pro"
      );

      if (retrySearchResult.ok) {
        const retryExtract = retrySearchResult.searchExtract?.trim() || "";
        if (retryExtract) {
          searchExtract = [searchExtract, retryExtract]
            .filter(Boolean)
            .join("\n")
            .trim();
        }

        if (retrySearchResult.mainSearchOutput?.trim()) {
          mainSearchOutput = retrySearchResult.mainSearchOutput.trim();
        }
        if (retrySearchResult.supportSearchOutput?.trim()) {
          supportSearchOutput = retrySearchResult.supportSearchOutput.trim();
        }
        webOutput = searchExtract || retrySearchResult.text.trim();
      }

      const retryReasoningResult = await runControllerV2ReasoningHelper(
        input.apiKey,
        retryInput,
        searchExtract
      );

      if (retryReasoningResult.ok && retryReasoningResult.text.trim()) {
        reasoningOutput = retryReasoningResult.text.trim();
      }

      if (reasoningOutput) {
        const retryVerifyResult = await runControllerV2Verify(
          input.apiKey,
          workingInput,
          reasoningOutput,
          searchExtract
        );

        if (retryVerifyResult.ok && retryVerifyResult.text.trim()) {
          verifyOutput = retryVerifyResult.text.trim();
        }
      }
    }
  }

  // 6) Refine once if there is any helper output
  const shouldRefine = Boolean(
  searchExtract || webOutput || reasoningOutput || fastOutput || verifyOutput
);

  if (shouldRefine) {
    const refineResult = await runControllerV2Refine(
      input.apiKey,
      workingInput,
      searchExtract,
      webOutput,
      reasoningOutput,
      fastOutput,
      verifyOutput
    );

    if (refineResult.ok) {
      refinedOutput = refineResult.text.trim();
    }
  }

  // 7) Final answer
  const finalResult = await runControllerV2Final(
    input.apiKey,
    workingInput,
    searchExtract,
    webOutput,
    reasoningOutput,
    fastOutput,
    verifyOutput,
    refinedOutput
  );

  if (finalResult.ok) {
    finalText = finalResult.text.trim();
  }

  return {
    ok: Boolean(finalText),
    plan,
    imageContext,
    plannerRaw,
    mainSearchOutput,
    supportSearchOutput,
    searchExtract,
    webOutput,
    reasoningOutput,
    verifyOutput,
    fastOutput,
    refinedOutput,
    finalText,
    reason: finalText ? "" : finalResult.error || "controller_v2_final_failed",
  };
};  
