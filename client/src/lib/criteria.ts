export type CriterionKey = "subject" | "style" | "composition" | "lighting" | "negative";

export const CRITERIA: Record<CriterionKey, { label: string; icon: string; color: string; tint: string }> = {
  subject:     { label: "주제 명확성",   icon: "solar:target-bold",           color: "#8b5cf6", tint: "#f3e8ff" },
  style:       { label: "스타일",        icon: "solar:palette-bold",          color: "#0ea5e9", tint: "#e0f2fe" },
  composition: { label: "구도와 시점",   icon: "solar:camera-bold",           color: "#10b981", tint: "#d1fae5" },
  lighting:    { label: "조명과 품질",   icon: "solar:sun-bold",              color: "#f59e0b", tint: "#fef3c7" },
  negative:    { label: "부정 프롬프트", icon: "solar:forbidden-circle-bold", color: "#f43f5e", tint: "#ffe4e6" },
};

export const CRITERION_KEYS = Object.keys(CRITERIA) as CriterionKey[];

export function isCriterionKey(value: unknown): value is CriterionKey {
  return typeof value === "string" && value in CRITERIA;
}
