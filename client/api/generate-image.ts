const GEMINI_IMAGE_MODEL = "gemini-3.1-flash-image";

type GeminiImageBlock = {
  data?: string;
  mime_type?: string;
  mimeType?: string;
  inline_data?: {
    data?: string;
    mime_type?: string;
    mimeType?: string;
  };
};

type GeminiInteractionResponse = {
  output_image?: GeminiImageBlock;
  steps?: unknown[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function findGeneratedImage(value: unknown): GeminiImageBlock | null {
  if (!isRecord(value)) return null;

  const inlineData = value.inline_data;
  if (isRecord(inlineData) && typeof inlineData.data === "string") {
    return {
      data: inlineData.data,
      mime_type: typeof inlineData.mime_type === "string" ? inlineData.mime_type : undefined,
      mimeType: typeof inlineData.mimeType === "string" ? inlineData.mimeType : undefined,
    };
  }

  if (typeof value.data === "string") {
    const mimeType =
      typeof value.mime_type === "string"
        ? value.mime_type
        : typeof value.mimeType === "string"
          ? value.mimeType
          : undefined;
    const type = typeof value.type === "string" ? value.type : "";

    if (mimeType?.startsWith("image/") || type.includes("image")) {
      return { data: value.data, mime_type: mimeType };
    }
  }

  for (const child of Object.values(value)) {
    if (Array.isArray(child)) {
      for (const item of child) {
        const image = findGeneratedImage(item);
        if (image) return image;
      }
    } else if (isRecord(child)) {
      const image = findGeneratedImage(child);
      if (image) return image;
    }
  }

  return null;
}

function summarizeGeminiResponse(body: GeminiInteractionResponse) {
  return {
    status: (body as { status?: string }).status,
    model: (body as { model?: string }).model,
    hasOutputImage: Boolean(body.output_image),
    stepTypes: body.steps?.map((step) => isRecord(step) ? step.type : typeof step),
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const prompt = req.body?.prompt;

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
  }

  try {
    const geminiResponse = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        model: GEMINI_IMAGE_MODEL,
        input: [{ type: "text", text: prompt.trim() }],
      }),
    });

    const body = (await geminiResponse.json()) as GeminiInteractionResponse & {
      error?: { message?: string };
    };

    if (!geminiResponse.ok) {
      console.error("[generate-image] Gemini error:", body);
      return res.status(geminiResponse.status).json({
        error: body.error?.message ?? "Image generation failed",
      });
    }

    const image = body.output_image?.data ? body.output_image : findGeneratedImage(body);
    if (!image?.data) {
      console.error("[generate-image] Missing image data:", summarizeGeminiResponse(body));
      return res.status(502).json({ error: "No image was generated" });
    }

    return res.status(200).json({
      imageData: image.data,
      mimeType: image.mime_type ?? image.mimeType ?? "image/png",
      model: GEMINI_IMAGE_MODEL,
    });
  } catch (err) {
    console.error("[generate-image] error:", err);
    return res.status(500).json({ error: "Image generation failed" });
  }
}
