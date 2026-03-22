export const extractControllerV2Text = (content: any): string => {
  if (typeof content === "string") return content.trim();

  if (Array.isArray(content)) {
    return content
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
      .trim();
  }

  if (typeof content?.text === "string") return content.text.trim();
  if (typeof content?.content === "string") return content.content.trim();

  return "";
};

export const extractControllerV2MessageText = (data: any): string => {
  const msg =
    data?.choices?.[0]?.message ||
    data?.choices?.[0]?.delta ||
    data?.message ||
    null;

  const text =
    extractControllerV2Text(msg?.content) ||
    (typeof msg?.reasoning === "string" ? msg.reasoning.trim() : "") ||
    (typeof data?.choices?.[0]?.text === "string"
      ? data.choices[0].text.trim()
      : "") ||
    (typeof data?.output_text === "string" ? data.output_text.trim() : "");

  return text.trim();
};

export const parseControllerV2Json = (raw: string): any | null => {
  const source = (raw || "").trim();
  if (!source) return null;

  const tryParse = (value: string) => {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const direct = tryParse(source);
  if (direct) return direct;

  const fencedMatch = source.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    const fenced = tryParse(fencedMatch[1]);
    if (fenced) return fenced;
  }

  const jsonMatch = source.match(/\{[\s\S]*\}/);
  if (jsonMatch?.[0]) {
    const loose = tryParse(jsonMatch[0]);
    if (loose) return loose;
  }

  return null;
};

export const isControllerV2Empty = (text: string): boolean => {
  return !(text || "").trim();
};
