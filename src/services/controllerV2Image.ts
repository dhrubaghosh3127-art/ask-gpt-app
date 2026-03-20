export interface ControllerV2ImageAnalysisInput {
  apiKey: string;
  imageBase64: string;
  mimeType?: string;
  userPrompt?: string;
}

export interface ControllerV2ImageAnalysisResult {
  ok: boolean;
  text: string;
  modelId: string;
  status: number;
  rawText: string;
  data: any;
  error?: string;
}

export const CONTROLLER_V2_IMAGE_MODEL =
  "meta-llama/llama-4-scout-17b-16e-instruct";

export const CONTROLLER_V2_GROQ_VISION_URL =
  "https://api.groq.com/openai/v1/chat/completions";

export const analyzeControllerV2Image = async (
  input: ControllerV2ImageAnalysisInput
): Promise<ControllerV2ImageAnalysisResult> => {
  const cleanImageBase64 = (input.imageBase64 || "")
    .replace(/^data:.*;base64,/, "")
    .trim();

  if (!cleanImageBase64) {
    return {
      ok: false,
      text: "",
      modelId: CONTROLLER_V2_IMAGE_MODEL,
      status: 400,
      rawText: "",
      data: null,
      error: "imageBase64 is required",
    };
  }

  const actualMimeType = (input.mimeType || "image/jpeg").trim() || "image/jpeg";
  const imageUrl = `data:${actualMimeType};base64,${cleanImageBase64}`;

  const prompt = (input.userPrompt || "").trim()
    ? `Analyze this image carefully in the context of the user's request.

User request:
${input.userPrompt.trim()}

Return only the useful image understanding result.
Include visible text if important, but do not do OCR-only output.
Describe what is actually in the image, such as UI, screenshot, math, objects, layout, and relevant visual meaning.
Do not mention hidden tools, routing, or internal system details.`
    : `Analyze this image carefully.
Return only the useful image understanding result.
Include visible text if important, but do not do OCR-only output.
Describe what is actually in the image, such as UI, screenshot, math, objects, layout, and relevant visual meaning.
Do not mention hidden tools, routing, or internal system details.`;

  const response = await fetch(CONTROLLER_V2_GROQ_VISION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.apiKey}`,
    },
    body: JSON.stringify({
      model: CONTROLLER_V2_IMAGE_MODEL,
      temperature: 0.1,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: { url: imageUrl },
            },
          ],
        },
      ],
    }),
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
      text: "",
      modelId: CONTROLLER_V2_IMAGE_MODEL,
      status: response.status,
      rawText,
      data,
      error:
        data?.error?.message ||
        data?.error ||
        data?.message ||
        rawText.slice(0, 300) ||
        "Controller V2 image analysis failed",
    };
  }

  const msg = data?.choices?.[0]?.message || null;
  const content = msg?.content;

  const text =
    typeof content === "string"
      ? content.trim()
      : Array.isArray(content)
        ? content
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
        : typeof data?.output_text === "string"
          ? data.output_text.trim()
          : "";

  return {
    ok: true,
    text,
    modelId: CONTROLLER_V2_IMAGE_MODEL,
    status: response.status,
    rawText,
    data,
  };
};
