export interface GeneratedImage {
  imageUrl: string;
  mimeType: string;
  model: string;
}

export async function generateImageFromPrompt(prompt: string): Promise<GeneratedImage> {
  const response = await fetch("/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error ?? "Image generation failed");
  }

  return {
    imageUrl: `data:${body.mimeType};base64,${body.imageData}`,
    mimeType: body.mimeType,
    model: body.model,
  };
}
