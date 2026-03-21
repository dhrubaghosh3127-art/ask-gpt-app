import {
  CONTROLLER_V2_MODELS,
  ControllerV2Input,
  buildControllerV2ReasoningPrompt,
  buildControllerV2WebPrompt,
  buildControllerV2FastPrompt,
} from "./controllerV2.js";
import { callControllerV2Model } from "./controllerV2Api.js";
import {
  extractControllerV2MessageText,
  isControllerV2Empty,
} from "./controllerV2Runtime.js";

export interface ControllerV2HelperCallResult {
  ok: boolean;
  text: string;
  error?: string;
}

export const runControllerV2ReasoningHelper = async (
  apiKey: string,
  input: ControllerV2Input
): Promise<ControllerV2HelperCallResult> => {
  const response = await callControllerV2Model({
    apiKey,
    model: CONTROLLER_V2_MODELS.reasoning,
    messages: [
      {
        role: "user",
        content: buildControllerV2ReasoningPrompt(input),
      },
    ],
    temperature: 0.2,
    maxTokens: 4096,
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
  };
};

export const runControllerV2WebHelper = async (
  apiKey: string,
  input: ControllerV2Input
): Promise<ControllerV2HelperCallResult> => {
  const response = await callControllerV2Model({
    apiKey,
    model: CONTROLLER_V2_MODELS.web,
    messages: [
      {
        role: "user",
        content: buildControllerV2WebPrompt(input),
      },
    ],
    temperature: 0.2,
    maxTokens: 4096,
  });

  if (!response.ok) {
    return {
      ok: false,
      text: "",
      error: response.error || "web_helper_failed",
    };
  }

  const text = extractControllerV2MessageText(response.data);

  if (isControllerV2Empty(text)) {
    return {
      ok: false,
      text: "",
      error: "web_helper_empty",
    };
  }

  return {
    ok: true,
    text,
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
    maxTokens: 1024,
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
  };
};
