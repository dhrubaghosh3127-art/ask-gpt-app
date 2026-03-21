import {
  ControllerV2Input,
  CONTROLLER_V2_MODELS,
  buildControllerV2RefineMessages,
  buildControllerV2FinalMessages,
} from "./controllerV2";
import { callControllerV2Model } from "./controllerV2Api";
import {
  extractControllerV2MessageText,
  isControllerV2Empty,
} from "./controllerV2Runtime";

export interface ControllerV2FinalizeResult {
  ok: boolean;
  text: string;
  error?: string;
}

export const runControllerV2Refine = async (
  apiKey: string,
  input: ControllerV2Input,
  reasoningOutput: string,
  webOutput: string,
  fastOutput: string
): Promise<ControllerV2FinalizeResult> => {
  const response = await callControllerV2Model({
    apiKey,
    model: CONTROLLER_V2_MODELS.mainBrain,
    messages: buildControllerV2RefineMessages(
      input,
      reasoningOutput,
      webOutput,
      fastOutput
    ),
    temperature: 0.2,
    maxCompletionTokens: 2048,
  });

  if (!response.ok) {
    return {
      ok: false,
      text: "",
      error: response.error || "refine_failed",
    };
  }

  const text = extractControllerV2MessageText(response.data);

  if (isControllerV2Empty(text)) {
    return {
      ok: false,
      text: "",
      error: "refine_empty",
    };
  }

  return {
    ok: true,
    text,
  };
};

export const runControllerV2Final = async (
  apiKey: string,
  input: ControllerV2Input,
  refinedOutput: string,
  reasoningOutput: string,
  webOutput: string,
  fastOutput: string
): Promise<ControllerV2FinalizeResult> => {
  const response = await callControllerV2Model({
    apiKey,
    model: CONTROLLER_V2_MODELS.mainBrain,
    messages: buildControllerV2FinalMessages(
      input,
      refinedOutput,
      reasoningOutput,
      webOutput,
      fastOutput
    ),
    temperature: 0.2,
    maxCompletionTokens: 2048,
  });

  if (!response.ok) {
    return {
      ok: false,
      text: "",
      error: response.error || "final_failed",
    };
  }

  const text = extractControllerV2MessageText(response.data);

  if (isControllerV2Empty(text)) {
    return {
      ok: false,
      text: "",
      error: "final_empty",
    };
  }

  return {
    ok: true,
    text,
  };
};
