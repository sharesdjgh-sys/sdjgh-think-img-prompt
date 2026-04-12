import { useState } from "react";
import type { ImageAnalysisResult } from "./lib/analyzer";
import { analyzeImagePrompt } from "./lib/analyzer";
import AnalysisResult from "./components/AnalysisResult";
import Tutorial from "./components/Tutorial";
import styles from "./App.module.css";

type Step = "tutorial" | "input" | "loading" | "result";

const CRITERIA = [
  { label: "주제 명확성", desc: "그릴 대상·배경·행동을 구체적으로 묘사하기",         color: "#6366f1", bg: "#eef2ff", border: "#c7d2fe" },
  { label: "스타일",      desc: "화풍·분위기·색감을 명확하게 지정하기",               color: "#0ea5e9", bg: "#f0f9ff", border: "#bae6fd" },
  { label: "구도와 시점", desc: "앵글·거리감(클로즈업/원경)을 넣기",                  color: "#10b981", bg: "#f0fdf4", border: "#bbf7d0" },
  { label: "조명과 품질", desc: "조명 방향·분위기·품질 태그 포함하기",                color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
  { label: "부정 프롬프트", desc: "원하지 않는 요소를 제외하기",                      color: "#ec4899", bg: "#fdf2f8", border: "#fbcfe8" },
];

const HOW_TO = [
  {
    step: "01",
    title: "이미지 프롬프트 입력",
    desc: "AI에게 보내려던 이미지 프롬프트를 그대로 입력하세요. 한국어도 괜찮아요.",
    color: "#6366f1",
  },
  {
    step: "02",
    title: "5가지 기준으로 분석",
    desc: "주제·스타일·구도·조명·부정 프롬프트 — 5가지 관점에서 점수와 피드백을 받아요.",
    color: "#0ea5e9",
  },
  {
    step: "03",
    title: "영문 개선안 + 번역 확인",
    desc: "개선된 영문 프롬프트와 한국어 번역, 추천 부정 프롬프트를 함께 확인하세요.",
    color: "#10b981",
  },
  {
    step: "04",
    title: "직접 다시 써보기",
    desc: "피드백을 참고해서 직접 고쳐보고 점수가 올랐는지 확인하세요.",
    color: "#f59e0b",
  },
];

export default function App() {
  const [step, setStep] = useState<Step>("tutorial");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<ImageAnalysisResult | null>(null);
  const [error, setError] = useState("");

  async function handleAnalyze() {
    if (!prompt.trim()) return;
    setStep("loading");
    setError("");
    try {
      const res = await analyzeImagePrompt(prompt);
      setResult(res);
      setStep("result");
    } catch {
      setError("분석 중 오류가 발생했어요. 다시 시도해주세요.");
      setStep("input");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) handleAnalyze();
  }

  if (step === "tutorial") {
    return <Tutorial onStart={() => setStep("input")} />;
  }

  if (step === "result" && result) {
    return <AnalysisResult original={prompt} result={result} onReset={() => { setStep("input"); setPrompt(""); setResult(null); }} />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        {/* 왼쪽: 헤더 + 분석 기준 */}
        <div className={styles.left}>
          <div className={styles.header}>
            <div className={styles.badge}>이미지 AI 프롬프트 학습 도우미</div>
            <h1 className={styles.title}>Think<br />Prompt</h1>
            <p className={styles.subtitle}>
              이미지 프롬프트를 그대로 입력하면<br />
              더 좋은 이미지를 만드는 프롬프트 작성법을 알려드려요.
            </p>
          </div>

          <div className={styles.criteriaSection}>
            <p className={styles.sectionTitle}>분석 기준</p>
            <div className={styles.criteria}>
              {CRITERIA.map((c) => (
                <div
                  key={c.label}
                  className={styles.criteriaItem}
                  style={{ background: c.bg, borderColor: c.border }}
                >
                  <span className={styles.criteriaLabel} style={{ color: c.color }}>{c.label}</span>
                  <span className={styles.criteriaDesc}>{c.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 오른쪽: 입력 + 버튼 + 사용 방법 */}
        <div className={styles.right}>
          <div className={`${styles.card} ${step === "loading" ? styles.cardLoading : ""}`}>
            <label className={styles.label}>프롬프트 입력</label>
            <textarea
              className={styles.textarea}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={"예) 귀여운 고양이 그려줘\n예) a girl in forest, anime style\n예) 판타지 숲 속 요정, 수채화 느낌\n예) futuristic city at night, neon lights, cinematic"}
              disabled={step === "loading"}
              rows={5}
            />
            <p className={styles.hint}>Ctrl+Enter로 빠르게 분석할 수 있어요</p>
            {error && <p className={styles.error}>{error}</p>}
          </div>

          <button
            className={`${styles.btn} ${step === "loading" ? styles.btnLoading : !prompt.trim() ? styles.btnDisabled : ""}`}
            onClick={handleAnalyze}
            disabled={step === "loading" || !prompt.trim()}
          >
            {step === "loading" ? (
              <span className={styles.loadingRow}>
                <span className={styles.spinner} />
                AI가 분석하는 중<span className={styles.dots}><span>.</span><span>.</span><span>.</span></span>
              </span>
            ) : "이미지 프롬프트 분석하기 →"}
          </button>

          <div className={styles.howToSection}>
            <p className={styles.sectionTitle}>이렇게 활용하세요</p>
            <div className={styles.howToGrid}>
              {HOW_TO.map((h) => (
                <div key={h.step} className={styles.howToItem}>
                  <div
                    className={styles.howToStep}
                    style={{ color: h.color, borderColor: h.color + "33", background: h.color + "11" }}
                  >
                    {h.step}
                  </div>
                  <div>
                    <p className={styles.howToTitle}>{h.title}</p>
                    <p className={styles.howToDesc}>{h.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
