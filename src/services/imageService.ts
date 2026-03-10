export interface GeneratedImageResult {
  imageUrl: string;
  modelId: string;
}

export const generateImage = async (
  prompt: string,
  modelId: string
): Promise<GeneratedImageResult> => {
  const apiUrl = import.meta.env.VITE_API_URL || "/api/chat";

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      modelId,
      mode: "image",
    }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || "Image generation failed");
  }

  if (!data?.imageUrl) {
    throw new Error("No image returned");
  }

  return {
    imageUrl: data.imageUrl,
    modelId: data.modelId || modelId,
  };
};
