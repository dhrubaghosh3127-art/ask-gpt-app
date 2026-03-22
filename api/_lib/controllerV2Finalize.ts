import {
  CONTROLLER_V2_MODELS,
  ControllerV2Input,
  buildControllerV2VerifyMessages,
  buildControllerV2RefineMessages,
  buildControllerV2FinalMessages,
} from "./controllerV2.js";
import { callControllerV2Model } from "./controllerV2Api.js";
import {
  extractControllerV2MessageText,
  isControllerV2Empty,
} from "./controllerV2Runtime.js";

export interface ControllerV2FinalizeResult {
  ok: boolean;
  text: string;
  rawText?: string;
  error?: string;
}

export const runControllerV2Verify = async (
  apiKey: string,
  input: ControllerV2Input,
  reasoningOutput: string,
  searchExtract: string
): Promise<ControllerV2FinalizeResult> => {
  const response = await callControllerV2Model({
    apiKey,
    model: CONTROLLER_V2_MODELS.verifier,
    messages: buildControllerV2VerifyMessages(
      input,
      reasoningOutput,
      searchExtract
    ),
    temperature: 0.1,
    maxCompletionTokens: 1200,
    reasoningEffort: "high",
  });

  if (!response.ok) {
    return {
      ok: false,
      text: "",
      error: response.error || "verify_failed",
    };
  }

  const text = extractControllerV2MessageText(response.data);

  if (isControllerV2Empty(text)) {
    return {
      ok: false,
      text: "",
      error: "verify_empty",
    };
  }

  return {
    ok: true,
    text,
    rawText: text,
  };
};

export const runControllerV2Refine = async (
  apiKey: string,
  input: ControllerV2Input,
  searchExtract: string,
  webOutput: string,
  reasoningOutput: string,
  fastOutput: string,
  verifyOutput: string
): Promise<ControllerV2FinalizeResult> => {
  const response = await callControllerV2Model({
    apiKey,
    model: CONTROLLER_V2_MODELS.refiner,
    messages: buildControllerV2RefineMessages(
      input,
      searchExtract,
      webOutput,
      reasoningOutput,
      fastOutput,
      verifyOutput
    ),
    temperature: 0.2,
    maxCompletionTokens: 1800,
    reasoningEffort: "high",
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
    rawText: text,
  };
};

export const runControllerV2Final = async (
  apiKey: string,
  input: ControllerV2Input,
  searchExtract: string,
  webOutput: string,
  reasoningOutput: string,
  fastOutput: string,
  verifyOutput: string,
  refinedOutput: string
): Promise<ControllerV2FinalizeResult> => {
  const response = await callControllerV2Model({
    apiKey,
    model: CONTROLLER_V2_MODELS.final,
    messages: buildControllerV2FinalMessages(
      input,
      searchExtract,
      webOutput,
      reasoningOutput,
      fastOutput,
      verifyOutput,
      refinedOutput
    ),
    temperature: 0.2,
    maxCompletionTokens: 2200,
    reasoningEffort: "high",
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
    rawText: text,
  };
};
