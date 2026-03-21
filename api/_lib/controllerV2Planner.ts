import {
  CONTROLLER_V2_MODELS,
  DEFAULT_CONTROLLER_V2_PLAN,
  ControllerV2Input,
  ControllerV2Plan,
  buildControllerV2PlanMessages,
  parseControllerV2Plan,
} from "./controllerV2.js";
import { callControllerV2Model } from "./controllerV2Api.js";
import {
  extractControllerV2MessageText,
  isControllerV2Empty,
  parseControllerV2Json,
} from "./controllerV2Runtime.js";

export interface ControllerV2PlannerResult {
  ok: boolean;
  plan: ControllerV2Plan;
  rawText: string;
  error?: string;
}

export const runControllerV2Planner = async (
  apiKey: string,
  input: ControllerV2Input
): Promise<ControllerV2PlannerResult> => {
  const response = await callControllerV2Model({
    apiKey,
    model: CONTROLLER_V2_MODELS.mainBrain,
    messages: buildControllerV2PlanMessages(input),
    temperature: 0.1,
    maxCompletionTokens: 500,
  });

  if (!response.ok) {
    return {
      ok: false,
      plan: DEFAULT_CONTROLLER_V2_PLAN,
      rawText: "",
      error: response.error || "planner_call_failed",
    };
  }

const rawText = extractControllerV2MessageText(response.data);

if (isControllerV2Empty(rawText)) {
  return {
    ok: false,
    plan: DEFAULT_CONTROLLER_V2_PLAN,
    rawText: "",
    error: "planner_empty_output",
  };
}

const parsedJson = parseControllerV2Json(rawText);

const normalizedPlanText =
  parsedJson &&
  typeof parsedJson === "object" &&
  !Array.isArray(parsedJson)
    ? JSON.stringify(parsedJson)
    : rawText;

return {
  ok: true,
  plan: parseControllerV2Plan(normalizedPlanText),
  rawText,
};
};
