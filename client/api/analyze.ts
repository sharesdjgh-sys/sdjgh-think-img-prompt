import Anthropic from "@anthropic-ai/sdk";
import { IMAGE_SYSTEM_PROMPT } from "./prompts.js";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const prompt = req.body?.prompt;

  if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: IMAGE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    const text = (response.content[0] as { text: string }).text
      .replace(/^```json\s*|```$/g, "")
      .trim();

    return res.status(200).json(JSON.parse(text));
  } catch (err) {
    console.error("[analyze] error:", err);
    return res.status(500).json({ error: "Analysis failed" });
  }
}
