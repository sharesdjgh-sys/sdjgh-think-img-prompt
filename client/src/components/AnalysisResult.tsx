import { useState } from "react";
import type { ImageAnalysisResult } from "../lib/analyzer";
import { analyzeImagePrompt } from "../lib/analyzer";
import type { GeneratedImage } from "../lib/imageGenerator";
import { generateImageFromPrompt } from "../lib/imageGenerator";
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
  const [generationPrompt, setGenerationPrompt] = useState(result.improved_prompt);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [originalImage, setOriginalImage] = useState<GeneratedImage | null>(null);
  const [improvedImage, setImprovedImage] = useState<GeneratedImage | null>(null);
  const [imageLoading, setImageLoading] = useState<"single" | "compare" | null>(null);
  const [imageError, setImageError] = useState("");
  const [previewImage, setPreviewImage] = useState<{ image: GeneratedImage; title: string } | null>(null);

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

  async function handleGenerateImage() {
    if (!generationPrompt.trim()) return;
    setImageLoading("single");
    setImageError("");
    try {
      const image = await generateImageFromPrompt(generationPrompt);
      setGeneratedImage(image);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "이미지 생성 중 오류가 발생했어요.");
    } finally {
      setImageLoading(null);
    }
  }

  async function handleCompareImages() {
    setImageLoading("compare");
    setImageError("");
    try {
      const [before, after] = await Promise.all([
        generateImageFromPrompt(original),
        generateImageFromPrompt(result.improved_prompt),
      ]);
      setOriginalImage(before);
      setImprovedImage(after);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "비교 이미지 생성 중 오류가 발생했어요.");
    } finally {
      setImageLoading(null);
    }
  }

  function downloadImage(image: GeneratedImage, filename: string) {
    const link = document.createElement("a");
    link.href = image.imageUrl;
    link.download = filename;
    link.click();
  }

  function setImageAspectRatio(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      img.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
    }
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

          {/* 영문 참고안 */}
          <div className={s.sectionMeta} style={{ marginTop: "16px" }}>
            <iconify-icon icon="solar:translation-bold" width="14" height="14" style={{ color: "var(--gray-400)" }} />
            <span className={s.sectionLabel}>영문 참고안</span>
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

        {/* 이미지 생성 실험실 */}
        <div className={s.card}>
          <div className={s.sectionMeta}>
            <iconify-icon icon="solar:gallery-wide-bold" width="14" height="14" style={{ color: "var(--primary)" }} />
            <span className={s.sectionLabel} data-accent>이미지로 확인하기</span>
          </div>
          <p className={s.imageLabDesc}>
            한국어 개선 프롬프트가 실제 이미지 결과를 어떻게 바꾸는지 바로 확인해보세요.
          </p>

          <div className={s.imagePromptPanel}>
            <div className={s.imagePromptHeader}>
              <span>생성에 사용할 프롬프트</span>
              <button className={s.promptResetBtn} onClick={() => setGenerationPrompt(result.improved_prompt)}>
                개선안으로 되돌리기
              </button>
            </div>
            <textarea
              className={s.imagePromptTextarea}
              value={generationPrompt}
              onChange={(e) => setGenerationPrompt(e.target.value)}
              rows={4}
            />
          </div>

          <div className={s.imageActionGrid}>
            <button
              className={`${s.imageActionBtn} ${s.imageActionBtnPrimary}`}
              onClick={handleGenerateImage}
              disabled={imageLoading !== null || !generationPrompt.trim()}
            >
              {imageLoading === "single" ? (
                <span className={s.loadingRow}><span className={s.spinner} />이미지 생성 중...</span>
              ) : (
                <span className={s.loadingRow}>
                  <iconify-icon icon="solar:magic-stick-3-bold" width="15" height="15" />
                  이미지 생성하기
                </span>
              )}
            </button>
            <button
              className={s.imageActionBtn}
              onClick={handleCompareImages}
              disabled={imageLoading !== null}
            >
              {imageLoading === "compare" ? (
                <span className={s.loadingRow}><span className={s.spinner} />비교 이미지 생성 중...</span>
              ) : (
                <span className={s.loadingRow}>
                  <iconify-icon icon="solar:slider-horizontal-bold" width="15" height="15" />
                  원본과 개선안 비교
                </span>
              )}
            </button>
          </div>

          {imageError && <div className={s.imageError}>{imageError}</div>}

          {generatedImage && (
            <div className={s.generatedImagePanel}>
              <div className={s.generatedImageHeader}>
                <div>
                  <span className={s.generatedImageLabel}>생성 결과</span>
                  <span className={s.generatedImageModel}>{generatedImage.model}</span>
                </div>
                <button
                  className={s.downloadBtn}
                  onClick={() => downloadImage(generatedImage, "think-prompt-generated.png")}
                >
                  <iconify-icon icon="solar:download-bold" width="14" height="14" />
                  다운로드
                </button>
              </div>
              <button
                className={s.imagePreviewBtn}
                onClick={() => setPreviewImage({ image: generatedImage, title: "생성 결과" })}
              >
                <img
                  className={s.generatedImage}
                  src={generatedImage.imageUrl}
                  alt="개선된 프롬프트로 생성한 이미지"
                  onLoad={setImageAspectRatio}
                />
              </button>
            </div>
          )}

          {(originalImage || improvedImage) && (
            <div className={s.compareImages}>
              <div className={s.compareImageCard}>
                <div className={s.compareImageHeader}>
                  <span>처음 프롬프트</span>
                  {originalImage && (
                    <button onClick={() => downloadImage(originalImage, "think-prompt-original.png")}>다운로드</button>
                  )}
                </div>
                {originalImage ? (
                  <button
                    className={s.imagePreviewBtn}
                    onClick={() => setPreviewImage({ image: originalImage, title: "처음 프롬프트" })}
                  >
                    <img
                      src={originalImage.imageUrl}
                      alt="처음 프롬프트로 생성한 이미지"
                      onLoad={setImageAspectRatio}
                    />
                  </button>
                ) : (
                  <div className={s.imagePlaceholder}>생성 대기</div>
                )}
              </div>
              <div className={s.compareImageCard} data-accent>
                <div className={s.compareImageHeader}>
                  <span>개선된 프롬프트</span>
                  {improvedImage && (
                    <button onClick={() => downloadImage(improvedImage, "think-prompt-improved.png")}>다운로드</button>
                  )}
                </div>
                {improvedImage ? (
                  <button
                    className={s.imagePreviewBtn}
                    onClick={() => setPreviewImage({ image: improvedImage, title: "개선된 프롬프트" })}
                  >
                    <img
                      src={improvedImage.imageUrl}
                      alt="개선된 프롬프트로 생성한 이미지"
                      onLoad={setImageAspectRatio}
                    />
                  </button>
                ) : (
                  <div className={s.imagePlaceholder}>생성 대기</div>
                )}
              </div>
            </div>
          )}
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

      {previewImage && (
        <div className={s.previewOverlay} role="dialog" aria-modal="true" onClick={() => setPreviewImage(null)}>
          <div className={s.previewDialog} onClick={(e) => e.stopPropagation()}>
            <div className={s.previewHeader}>
              <div>
                <span className={s.previewTitle}>{previewImage.title}</span>
                <span className={s.previewModel}>{previewImage.image.model}</span>
              </div>
              <div className={s.previewActions}>
                <button onClick={() => downloadImage(previewImage.image, "think-prompt-preview.png")}>
                  <iconify-icon icon="solar:download-bold" width="14" height="14" />
                  다운로드
                </button>
                <button onClick={() => setPreviewImage(null)} aria-label="이미지 크게 보기 닫기">
                  <iconify-icon icon="solar:close-circle-bold" width="18" height="18" />
                </button>
              </div>
            </div>
            <img className={s.previewImage} src={previewImage.image.imageUrl} alt={`${previewImage.title} 크게 보기`} />
          </div>
        </div>
      )}
    </div>
  );
}
