export interface ImageAnalysisResult {
  scores: {
    subject: number;
    style: number;
    composition: number;
    lighting: number;
    negative: number;
  };
  total: number;
  overall_comment: string;
  feedback: {
    subject: string;
    style: string;
    composition: string;
    lighting: string;
    negative: string;
  };
  improved_prompt: string;
  improved_prompt_ko: string;
  negative_prompt: string;
  changes: { what: string; why: string }[];
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
