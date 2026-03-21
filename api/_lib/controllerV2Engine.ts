import { CONTROLLER_V2_CONFIG } from "./featureFlags.js";
import {
  ControllerV2Input,
  ControllerV2Result,
  ControllerV2Plan,
  DEFAULT_CONTROLLER_V2_PLAN,
} from "./controllerV2";
import { analyzeControllerV2Image } from "./controllerV2Image";
import { runControllerV2Planner } from "./controllerV2Planner";
import {
  runControllerV2ReasoningHelper,
  runControllerV2WebHelper,
  runControllerV2FastHelper,
} from "./controllerV2Helpers";
import {
  runControllerV2Refine,
  runControllerV2Final,
} from "./controllerV2Finalize";

export interface ControllerV2EngineInput extends ControllerV2Input {
  apiKey: string;
  imageBase64?: string;
  mimeType?: string;
}

const shouldUseFastDraft = (plan: ControllerV2Plan) => {
  return (
    CONTROLLER_V2_CONFIG.enableFastPath &&
    plan.is_simple &&
    !plan.needs_reasoning &&
    !plan.needs_web &&
    plan.confidence >= CONTROLLER_V2_CONFIG.plannerMinConfidence
  );
};

export const runControllerV2Engine = async (
  input: ControllerV2EngineInput
): Promise<ControllerV2Result> => {
  let imageContext = input.imageContext || "";
  let plan: ControllerV2Plan = DEFAULT_CONTROLLER_V2_PLAN;
  let reasoningOutput = "";
  let webOutput = "";
  let fastOutput = "";
  let refinedOutput = "";

  if (
    CONTROLLER_V2_CONFIG.useImagePrecheck &&
    input.hasImage &&
    input.imageBase64?.trim()
  ) {
    const imageResult = await analyzeControllerV2Image({
      apiKey: input.apiKey,
      imageBase64: input.imageBase64,
      mimeType: input.mimeType,
      userPrompt: input.prompt,
    });

    if (imageResult.ok && imageResult.text.trim()) {
      imageContext = imageResult.text.trim();
    }
  }

  const plannerResult = await runControllerV2Planner(input.apiKey, {
    prompt: input.prompt,
    messages: input.messages,
    systemInstruction: input.systemInstruction,
    hasImage: input.hasImage,
    imageContext,
  });

  if (plannerResult.ok) {
    plan = plannerResult.plan;
  }

  if (plan.needs_reasoning) {
    const reasoningResult = await runControllerV2ReasoningHelper(input.apiKey, {
      prompt: input.prompt,
      messages: input.messages,
      systemInstruction: input.systemInstruction,
      hasImage: input.hasImage,
      imageContext,
    });

    if (reasoningResult.ok && reasoningResult.text.trim()) {
      reasoningOutput = reasoningResult.text.trim();
    }
  }

  if (plan.needs_web) {
    const webResult = await runControllerV2WebHelper(input.apiKey, {
      prompt: input.prompt,
      messages: input.messages,
      systemInstruction: input.systemInstruction,
      hasImage: input.hasImage,
      imageContext,
    });

    if (webResult.ok && webResult.text.trim()) {
      webOutput = webResult.text.trim();
    }
  }

  if (shouldUseFastDraft(plan)) {
    const fastResult = await runControllerV2FastHelper(input.apiKey, {
      prompt: input.prompt,
      messages: input.messages,
      systemInstruction: input.systemInstruction,
      hasImage: input.hasImage,
      imageContext,
    });

    if (fastResult.ok && fastResult.text.trim()) {
      fastOutput = fastResult.text.trim();
    }
  }

  if (
    CONTROLLER_V2_CONFIG.enableFeedbackLoop &&
    (reasoningOutput || webOutput || fastOutput)
  ) {
    for (let i = 0; i < CONTROLLER_V2_CONFIG.maxFeedbackRetries; i += 1) {
      const refineResult = await runControllerV2Refine(
        input.apiKey,
        {
          prompt: input.prompt,
          messages: input.messages,
          systemInstruction: input.systemInstruction,
          hasImage: input.hasImage,
          imageContext,
        },
        reasoningOutput,
        webOutput,
        fastOutput
      );

      if (refineResult.ok && refineResult.text.trim()) {
        refinedOutput = refineResult.text.trim();
        break;
      }
    }
  }

  const finalResult = await runControllerV2Final(
    input.apiKey,
    {
      prompt: input.prompt,
      messages: input.messages,
      systemInstruction: input.systemInstruction,
      hasImage: input.hasImage,
      imageContext,
    },
    refinedOutput,
    reasoningOutput,
    webOutput,
    fastOutput
  );

  if (!finalResult.ok || !finalResult.text.trim()) {
    return {
      ok: false,
      plan,
      imageContext,
      reasoningOutput,
      webOutput,
      fastOutput,
      refinedOutput,
      finalText: "",
      reason: finalResult.error || "controller_v2_final_failed",
    };
  }

  return {
    ok: true,
    plan,
    imageContext,
    reasoningOutput,
    webOutput,
    fastOutput,
    refinedOutput,
    finalText: finalResult.text.trim(),
  };
};
