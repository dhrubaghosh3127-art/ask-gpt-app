export interface ControllerV2ModelCallInput {
  apiKey: string;
  model: string;
  messages: any[];
  temperature?: number;
  maxTokens?: number;
  maxCompletionTokens?: number;
  reasoningEffort?: "none" | "default" | "low" | "medium" | "high";
  reasoningFormat?: "hidden" | "parsed" | "raw";
}

export interface ControllerV2ModelCallResult {
  ok: boolean;
  status: number;
  rawText: string;
  data: any;
  error?: string;
}

export const CONTROLLER_V2_GROQ_URL =
  "https://api.groq.com/openai/v1/chat/completions";

export const callControllerV2Model = async (
  input: ControllerV2ModelCallInput
): Promise<ControllerV2ModelCallResult> => {
  const requestBody: Record<string, any> = {
    model: input.model,
    messages: input.messages,
    temperature:
      typeof input.temperature === "number" ? input.temperature : 0.2,
  };

  if (typeof input.maxTokens === "number") {
    requestBody.max_tokens = input.maxTokens;
  }

  if (typeof input.maxCompletionTokens === "number") {
    requestBody.max_completion_tokens = input.maxCompletionTokens;
  }

  if (input.reasoningEffort) {
    requestBody.reasoning_effort = input.reasoningEffort;
  }

  if (input.reasoningFormat) {
    requestBody.reasoning_format = input.reasoningFormat;
  }

  const response = await fetch(CONTROLLER_V2_GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  const rawText = await response.text();

  let data: any = null;
  try {
    data = rawText ? JSON.parse(rawText) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      rawText,
      data,
      error:
        data?.error?.message ||
        data?.error ||
        data?.message ||
        rawText.slice(0, 300) ||
        "controller_v2_model_call_failed",
    };
  }

  return {
    ok: true,
    status: response.status,
    rawText,
    data,
  };
};
