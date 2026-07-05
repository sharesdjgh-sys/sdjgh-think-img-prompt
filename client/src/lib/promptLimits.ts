const RECOMMENDED_INPUT_TOKENS = 2500;
const CAUTION_RATIO = 0.8;

function countMatches(value: string, pattern: RegExp) {
  return value.match(pattern)?.length ?? 0;
}

export function estimatePromptTokens(value: string) {
  const koreanChars = countMatches(value, /[가-힣ㄱ-ㅎㅏ-ㅣ]/g);
  const cjkChars = countMatches(value, /[\u3400-\u9fff]/g);
  const latinChars = countMatches(value, /[A-Za-z0-9]/g);
  const whitespaceChars = countMatches(value, /\s/g);
  const punctuationChars = countMatches(value, /[^\sA-Za-z0-9가-힣ㄱ-ㅎㅏ-ㅣ\u3400-\u9fff]/g);
  const otherChars = Math.max(
    value.length - koreanChars - cjkChars - latinChars - whitespaceChars - punctuationChars,
    0,
  );

  return Math.ceil(
    koreanChars / 1.45 +
      cjkChars +
      latinChars / 4 +
      punctuationChars / 2 +
      whitespaceChars / 8 +
      otherChars / 2,
  );
}

export function getPromptLimitInfo(value: string) {
  const text = value.trim();
  const currentChars = value.length;
  const estimatedTokens = estimatePromptTokens(text);
  const charsPerToken = estimatedTokens > 0 ? currentChars / estimatedTokens : 1.45;
  const recommendedMaxChars = Math.max(1000, Math.round(RECOMMENDED_INPUT_TOKENS * charsPerToken));
  const usageRatio = estimatedTokens / RECOMMENDED_INPUT_TOKENS;
  const remainingChars = recommendedMaxChars - currentChars;
  const status = usageRatio >= 1 ? "over" : usageRatio >= CAUTION_RATIO ? "caution" : "ok";

  return {
    currentChars,
    estimatedTokens,
    recommendedMaxChars,
    remainingChars,
    status,
  };
}
