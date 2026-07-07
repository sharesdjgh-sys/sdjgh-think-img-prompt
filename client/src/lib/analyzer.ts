import type { CriterionKey } from "./criteria";

export interface ImageAnalysisResult {
  scores: Record<CriterionKey, number>;
  total: number;
  overall_comment: string;
  feedback: Record<CriterionKey, string>;
  improved_prompt: string;
  prompt_parts?: { text: string; criterion: CriterionKey | null }[];
  expected_score?: number;
  negative_prompt: string;
  changes: { what: string; why: string; criterion?: CriterionKey | null }[];
  tip: string;
}

export async function analyzeImagePrompt(userPrompt: string): Promise<ImageAnalysisResult> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: userPrompt }),
  });

  if (!response.ok) {
    throw new Error("Analysis failed");
  }

  return response.json();
}
