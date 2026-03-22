import {
  CONTROLLER_V2_MODELS,
  ControllerV2Input,
  ControllerV2Plan,
  DEFAULT_CONTROLLER_V2_PLAN,
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

const normalizePlan = (
  plan: ControllerV2Plan,
  prompt: string
): ControllerV2Plan => {
  const normalized: ControllerV2Plan = {
    needs_reasoning: Boolean(plan.needs_reasoning),
    needs_web: Boolean(plan.needs_web),
    is_simple: Boolean(plan.is_simple),
    search_mode:
      plan.search_mode === "fast" || plan.search_mode === "pro"
        ? plan.search_mode
        : "none",
    is_math: Boolean(plan.is_math),
    reasoning_scope:
      plan.reasoning_scope === "closed" || plan.reasoning_scope === "open"
        ? plan.reasoning_scope
        : "none",
    confidence:
      typeof plan.confidence === "number"
        ? Math.max(0, Math.min(1, plan.confidence))
        : 0,
  };

  const t = (prompt || "").toLowerCase();

  const hasMathSignal =
    /prove|proof|theorem|lemma|inequality|equation|integral|derivative|sum|geometry|algebra|trig|trigonometry|calculus|olympiad|find x|solve for|sin|cos|tan|log|sqrt|frac|\d+\s*[\+\-\*\/=]\s*\d+|≥|≤|∑|∫/.test(
      t
    );

  const hasCurrentSignal =
    /ajke|aajke|today|current|latest|news|tarik|date|time|live|recent|breaking|update/.test(
      t
    );

  const hasSimpleSignal =
    /^(hi|hello|hey|kmn acho|kemon acho|valo ki kortecho|what'?s up|yo)[!. ]*$/i.test(
      prompt || ""
    );

  const hasOpenReasoningSignal =
    /compare|difference|which is better|pros and cons|analyze|analysis|strategy|context|example|real world|external|research/.test(
      t
    );

  // Hard lock: any math => always pro-search first
  if (hasMathSignal) {
    normalized.is_math = true;
    normalized.needs_reasoning = true;
    normalized.needs_web = true;
    normalized.search_mode = "pro";
    normalized.reasoning_scope = "open";
    normalized.is_simple = false;
    normalized.confidence = Math.max(normalized.confidence, 0.95);
  }

  // Current/news/date/time => web needed
  if (hasCurrentSignal && !normalized.is_math) {
    normalized.needs_web = true;
    if (!normalized.needs_reasoning) {
      normalized.search_mode = "fast";
    }
    normalized.is_simple = false;
    normalized.confidence = Math.max(normalized.confidence, 0.9);
  }

  // Hard non-math open reasoning => pro-search first
  if (
    hasOpenReasoningSignal &&
    !normalized.is_math &&
    normalized.needs_reasoning
  ) {
    normalized.needs_web = true;
    normalized.search_mode = "pro";
    normalized.reasoning_scope = "open";
    normalized.is_simple = false;
  }

  // Force simple greeting/direct tiny request
  if (hasSimpleSignal && !hasCurrentSignal && !hasMathSignal) {
    normalized.is_simple = true;
    normalized.needs_reasoning = false;
    normalized.needs_web = false;
    normalized.search_mode = "none";
    normalized.reasoning_scope = "none";
    normalized.confidence = Math.max(normalized.confidence, 0.95);
  }

  // Pro / fast search means web is required
  if (normalized.search_mode === "pro" || normalized.search_mode === "fast") {
    normalized.needs_web = true;
  }

  // Hard non-math reasoning must have a scope
  if (
    normalized.needs_reasoning &&
    !normalized.is_math &&
    normalized.reasoning_scope === "none"
  ) {
    normalized.reasoning_scope = normalized.needs_web ? "open" : "closed";
  }

  // Very simple non-web path
  if (
    normalized.is_simple &&
    !normalized.needs_reasoning &&
    !normalized.needs_web
  ) {
    normalized.search_mode = "none";
    normalized.reasoning_scope = "none";
  }

  return normalized;
};

export const runControllerV2Planner = async (
  apiKey: string,
  input: ControllerV2Input
): Promise<ControllerV2PlannerResult> => {
  const response = await callControllerV2Model({
    apiKey,
    model: CONTROLLER_V2_MODELS.planner,
    messages: buildControllerV2PlanMessages(input),
    temperature: 0.1,
    maxCompletionTokens: 500,
    reasoningEffort: "high",
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

  const parsedPlan = parseControllerV2Plan(normalizedPlanText);
  const finalPlan = normalizePlan(parsedPlan);

  return {
    ok: true,
    plan: finalPlan,
    rawText,
  };
};
