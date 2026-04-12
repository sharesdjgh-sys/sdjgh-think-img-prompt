import { useState } from "react";
import type { ImageAnalysisResult } from "../lib/analyzer";
import { analyzeImagePrompt } from "../lib/analyzer";
import ScoreBar from "./ScoreBar";
import s from "./AnalysisResult.module.css";

interface Props {
  original: string;
  result: ImageAnalysisResult;
  onReset: () => void;
}

const SCORE_LABELS: Record<keyof ImageAnalysisResult["scores"], string> = {
  subject: "주제 명확성",
  style: "스타일",
  composition: "구도와 시점",
  lighting: "조명과 품질",
  negative: "부정 프롬프트",
};

function getTotalColor(total: number) {
  if (total >= 70) return "#34d399";
  if (total >= 40) return "#fbbf24";
  return "#f87171";
}

function getScoreGrade(total: number) {
  if (total >= 80) return "우수";
  if (total >= 60) return "양호";
  if (total >= 40) return "보통";
  return "개선 필요";
}

export default function AnalysisResult({ original, result, onReset }: Props) {
  const [practice, setPractice] = useState("");
  const [practiceResult, setPracticeResult] = useState<ImageAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copiedNeg, setCopiedNeg] = useState(false);

  async function handlePractice() {
    if (!practice.trim()) return;
    setLoading(true);
    try {
      const res = await analyzeImagePrompt(practice);
      setPracticeResult(res);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(result.improved_prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleCopyNeg() {
    navigator.clipboard.writeText(result.negative_prompt);
    setCopiedNeg(true);
    setTimeout(() => setCopiedNeg(false), 2000);
  }

  const diff = practiceResult ? practiceResult.total - result.total : 0;

  return (
    <div className={s.page}>
      <div className={s.container}>

        {/* 뒤로 버튼 */}
        <button className={s.backBtn} onClick={onReset}>
          <iconify-icon icon="solar:arrow-left-bold" width="14" height="14" />
          새 프롬프트 분석하기
        </button>

        {/* 총점 카드 */}
        <div className={s.scoreCard}>
          <div className={s.scoreCardInner}>
            <div className={s.scoreBadge}>{getScoreGrade(result.total)}</div>
            <div className={s.scoreNumber}>{result.total}</div>
            <div className={s.scoreMax}>/ 100점</div>
          </div>
          <p className={s.overallComment}>{result.overall_comment}</p>
        </div>

        {/* 원본 프롬프트 */}
        <div className={s.card}>
          <div className={s.sectionMeta}>
            <iconify-icon icon="solar:pen-bold" width="14" height="14" style={{ color: "var(--gray-400)" }} />
            <span className={s.sectionLabel}>입력한 프롬프트</span>
          </div>
          <div className={s.originalBox}>{original}</div>
        </div>

        {/* 항목별 점수 */}
        <div className={s.card}>
          <div className={s.sectionMeta}>
            <iconify-icon icon="solar:chart-square-bold" width="14" height="14" style={{ color: "var(--primary)" }} />
            <span className={s.sectionLabel} data-accent>5가지 기준 분석</span>
          </div>
          {(Object.keys(result.scores) as (keyof ImageAnalysisResult["scores"])[]).map((key, i) => (
            <ScoreBar
              key={key}
              index={i}
              label={SCORE_LABELS[key]}
              score={result.scores[key]}
              feedback={result.feedback[key]}
            />
          ))}
        </div>

        {/* 개선된 프롬프트 */}
        <div className={s.card}>
          <div className={s.improvedHeader}>
            <div className={s.sectionMeta}>
              <iconify-icon icon="solar:magic-stick-3-bold" width="14" height="14" style={{ color: "var(--primary)" }} />
              <span className={s.sectionLabel} data-accent>개선된 프롬프트</span>
            </div>
            <button
              onClick={handleCopy}
              className={`${s.copyBtn} ${copied ? s.copyBtnCopied : s.copyBtnDefault}`}
            >
              {copied
                ? <><iconify-icon icon="solar:check-circle-bold" width="13" height="13" />복사됨</>
                : <><iconify-icon icon="solar:copy-bold" width="13" height="13" />복사</>}
            </button>
          </div>
          <div className={s.improvedBox}>{result.improved_prompt}</div>

          {/* 한국어 번역 */}
          <div className={s.sectionMeta} style={{ marginTop: "16px" }}>
            <iconify-icon icon="solar:translation-bold" width="14" height="14" style={{ color: "var(--gray-400)" }} />
            <span className={s.sectionLabel}>한국어 번역</span>
          </div>
          <div className={s.improvedBoxKo}>{result.improved_prompt_ko}</div>

          {/* 부정 프롬프트 */}
          <div className={s.negativeHeader} style={{ marginTop: "16px" }}>
            <div className={s.sectionMeta}>
              <iconify-icon icon="solar:forbidden-circle-bold" width="14" height="14" style={{ color: "#f43f5e" }} />
              <span className={s.sectionLabel}>추천 부정 프롬프트</span>
            </div>
            <button
              onClick={handleCopyNeg}
              className={`${s.copyBtn} ${copiedNeg ? s.copyBtnCopied : s.copyBtnDefault}`}
            >
              {copiedNeg
                ? <><iconify-icon icon="solar:check-circle-bold" width="13" height="13" />복사됨</>
                : <><iconify-icon icon="solar:copy-bold" width="13" height="13" />복사</>}
            </button>
          </div>
          <div className={s.negativeBox}>{result.negative_prompt}</div>

          <div className={s.sectionMeta} style={{ marginTop: "24px" }}>
            <iconify-icon icon="solar:info-circle-bold" width="14" height="14" style={{ color: "var(--gray-400)" }} />
            <span className={s.sectionLabel}>무엇이 왜 바뀌었나요?</span>
          </div>
          <div className={s.changeList}>
            {result.changes.map((c, i) => (
              <div key={i} className={s.changeItem}>
                <div className={s.changeNum}>{i + 1}</div>
                <div className={s.changeContent}>
                  <span className={s.changeWhat}>{c.what}</span>
                  <span className={s.changeWhy}>{c.why}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 팁 */}
        <div className={s.tip}>
          <div className={s.tipHeader}>
            <div className={s.tipIconWrap}>
              <iconify-icon icon="solar:lightbulb-bolt-bold" width="16" height="16" />
            </div>
            <span className={s.tipLabel}>오늘의 팁</span>
          </div>
          <p className={s.tipText}>{result.tip}</p>
        </div>

        {/* 직접 써보기 */}
        <div className={s.card}>
          <div className={s.sectionMeta}>
            <iconify-icon icon="solar:pen-new-round-bold" width="14" height="14" style={{ color: "var(--primary)" }} />
            <span className={s.sectionLabel} data-accent>직접 다시 써보기</span>
          </div>
          <p className={s.practiceDesc}>
            개선 내용을 참고해서 프롬프트를 직접 수정해보세요.<br />점수가 얼마나 올랐는지 확인할 수 있어요.
          </p>
          <textarea
            className={s.practiceTextarea}
            value={practice}
            onChange={(e) => setPractice(e.target.value)}
            placeholder="개선한 이미지 프롬프트를 여기에 입력해보세요..."
            rows={4}
          />
          <button
            className={`${s.practiceBtn} ${practice.trim() && !loading ? s.practiceBtnActive : s.practiceBtnDisabled}`}
            onClick={handlePractice}
            disabled={loading || !practice.trim()}
          >
            {loading ? (
              <span className={s.loadingRow}>
                <span className={s.spinner} />분석 중...
              </span>
            ) : (
              <span className={s.loadingRow}>
                내 프롬프트 점수 확인하기
                <iconify-icon icon="solar:arrow-right-bold" width="14" height="14" />
              </span>
            )}
          </button>

          {practiceResult && (
            <div className={s.compareSection}>
              <div className={s.compareRow}>
                <div className={`${s.compareBox} ${s.compareBoxBefore}`}>
                  <div className={s.compareLabel}>처음 점수</div>
                  <div className={s.compareScore} style={{ color: getTotalColor(result.total) }}>
                    {result.total}
                  </div>
                </div>
                <div className={s.compareArrow}>
                  <iconify-icon icon="solar:arrow-right-bold" width="18" height="18" />
                </div>
                <div className={`${s.compareBox} ${diff > 0 ? s.compareBoxAfterUp : diff === 0 ? s.compareBoxAfterSame : s.compareBoxAfterDown}`}>
                  <div className={s.compareLabel}>내 점수</div>
                  <div className={s.compareScore} style={{ color: getTotalColor(practiceResult.total) }}>
                    {practiceResult.total}
                  </div>
                </div>
              </div>
              <div className={`${s.compareMessage} ${diff > 0 ? s.compareMessageUp : diff === 0 ? s.compareMessageSame : s.compareMessageDown}`}>
                {diff > 0
                  ? <><iconify-icon icon="solar:star-bold" width="14" height="14" />{` ${diff}점 올랐어요! 훨씬 좋아졌어요.`}</>
                  : diff === 0
                  ? <><iconify-icon icon="solar:refresh-bold" width="14" height="14" />{" 비슷한 수준이에요. 팁을 참고해서 다시 도전해보세요!"}</>
                  : <><iconify-icon icon="solar:arrow-up-bold" width="14" height="14" />{" 개선 내역을 다시 읽고 도전해보세요!"}</>}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
