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

type PromptHelperItem = {
  label: string;
  sentence: string;
  keywords: string[];
};

type PromptHelperGroup = {
  title: string;
  desc: string;
  scoreKey?: keyof ImageAnalysisResult["scores"];
  keywords: string[];
  items: PromptHelperItem[];
};

const PROMPT_HELPERS = [
  {
    title: "스타일",
    desc: "어떤 느낌으로 그릴지",
    scoreKey: "style",
    keywords: ["스타일", "화풍", "일러스트", "실사", "수채화", "애니메이션", "3D", "포스터", "동화책"],
    items: [
      { label: "수채화", sentence: "부드러운 수채화 일러스트 스타일로 표현해줘.", keywords: ["수채화"] },
      { label: "애니메이션", sentence: "애니메이션 일러스트 스타일로 표현해줘.", keywords: ["애니메이션", "anime"] },
      { label: "실사", sentence: "실사 사진처럼 사실적인 스타일로 표현해줘.", keywords: ["실사", "사실적", "사진"] },
      { label: "3D", sentence: "입체감 있는 3D 캐릭터 렌더링 스타일로 표현해줘.", keywords: ["3D", "렌더링"] },
      { label: "포스터", sentence: "시선을 끄는 포스터 디자인 스타일로 표현해줘.", keywords: ["포스터"] },
      { label: "동화책", sentence: "따뜻한 동화책 삽화 스타일로 표현해줘.", keywords: ["동화책", "삽화"] },
    ],
  },
  {
    title: "구도와 시점",
    desc: "어디서 어떻게 볼지",
    scoreKey: "composition",
    keywords: ["구도", "시점", "정면", "클로즈업", "전신", "위에서", "내려다", "올려다", "와이드", "샷", "앵글"],
    items: [
      { label: "정면", sentence: "정면에서 바라본 구도로 구성해줘.", keywords: ["정면"] },
      { label: "클로즈업", sentence: "주요 대상이 잘 보이는 클로즈업 구도로 구성해줘.", keywords: ["클로즈업"] },
      { label: "전신", sentence: "대상의 전신이 보이는 구도로 구성해줘.", keywords: ["전신"] },
      { label: "위에서", sentence: "위에서 내려다본 시점으로 구성해줘.", keywords: ["위에서", "내려다"] },
      { label: "낮은 각도", sentence: "낮은 각도에서 올려다본 시점으로 구성해줘.", keywords: ["낮은 각도", "올려다"] },
      { label: "와이드 샷", sentence: "배경이 넓게 보이는 와이드 샷으로 구성해줘.", keywords: ["와이드", "wide"] },
    ],
  },
  {
    title: "조명과 품질",
    desc: "빛과 완성도",
    scoreKey: "lighting",
    keywords: ["조명", "빛", "햇살", "자연광", "네온", "영화", "선명", "디테일", "고품질", "화질", "완성도"],
    items: [
      { label: "자연광", sentence: "부드러운 자연광이 느껴지게 표현해줘.", keywords: ["자연광"] },
      { label: "오후 햇살", sentence: "따뜻한 오후 햇살이 들어오는 분위기로 표현해줘.", keywords: ["오후 햇살", "햇살"] },
      { label: "영화 조명", sentence: "극적인 영화 조명처럼 빛의 대비가 느껴지게 표현해줘.", keywords: ["영화 조명", "극적인"] },
      { label: "네온", sentence: "선명한 네온 조명이 돋보이게 표현해줘.", keywords: ["네온"] },
      { label: "고품질", sentence: "선명하고 디테일한 고품질 이미지로 만들어줘.", keywords: ["고품질", "디테일"] },
      { label: "완성도", sentence: "깨끗하고 완성도 높은 결과물로 만들어줘.", keywords: ["완성도"] },
    ],
  },
  {
    title: "부정 프롬프트",
    desc: "피하고 싶은 요소",
    scoreKey: "negative",
    keywords: ["제외", "피해", "없이", "부정", "흐릿", "왜곡", "워터마크", "낮은 화질", "어색한 손"],
    items: [
      { label: "흐림 제외", sentence: "부정 프롬프트에는 흐릿한 이미지(blurry)를 제외한다고 넣어줘.", keywords: ["흐릿", "blurry"] },
      { label: "손 오류 제외", sentence: "부정 프롬프트에는 어색한 손과 손가락을 제외한다고 넣어줘.", keywords: ["어색한 손", "손가락"] },
      { label: "얼굴 왜곡 제외", sentence: "부정 프롬프트에는 왜곡된 얼굴을 제외한다고 넣어줘.", keywords: ["왜곡된 얼굴", "얼굴 왜곡"] },
      { label: "워터마크 제외", sentence: "부정 프롬프트에는 글자와 워터마크를 제외한다고 넣어줘.", keywords: ["워터마크", "글자"] },
      { label: "저화질 제외", sentence: "부정 프롬프트에는 낮은 화질(low quality)을 제외한다고 넣어줘.", keywords: ["낮은 화질", "low quality"] },
      { label: "불필요한 물체 제외", sentence: "부정 프롬프트에는 불필요한 물체를 제외한다고 넣어줘.", keywords: ["불필요한 물체"] },
    ],
  },
  {
    title: "비율",
    desc: "이미지 화면 크기",
    keywords: ["비율", "1:1", "16:9", "9:16", "4:3", "3:4", "정사각형", "가로형", "세로형", "포스터"],
    items: [
      { label: "1:1", sentence: "이미지 비율은 1:1 정사각형 비율로 만들어줘.", keywords: ["1:1", "정사각형"] },
      { label: "16:9", sentence: "이미지 비율은 16:9 가로형 비율로 만들어줘.", keywords: ["16:9", "가로형"] },
      { label: "9:16", sentence: "이미지 비율은 9:16 세로형 비율로 만들어줘.", keywords: ["9:16", "세로형"] },
      { label: "4:3", sentence: "이미지 비율은 4:3 일반 사진 비율로 만들어줘.", keywords: ["4:3"] },
      { label: "3:4", sentence: "이미지 비율은 3:4 세로 포스터 비율로 만들어줘.", keywords: ["3:4", "세로 포스터"] },
    ],
  },
] satisfies PromptHelperGroup[];

function normalizePrompt(value: string) {
  return value.toLowerCase().replace(/\s+/g, " ");
}

function includesAny(prompt: string, keywords: string[]) {
  const normalized = normalizePrompt(prompt);
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
}

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

  function isHelperItemApplied(item: PromptHelperItem, prompt = generationPrompt) {
    return includesAny(prompt, item.keywords);
  }

  function isHelperGroupApplied(group: PromptHelperGroup, prompt = generationPrompt) {
    return includesAny(prompt, group.keywords) || group.items.some((item) => isHelperItemApplied(item, prompt));
  }

  function getRecommendedItems(group: PromptHelperGroup) {
    const groupApplied = isHelperGroupApplied(group);
    const lowScore = group.scoreKey ? result.scores[group.scoreKey] < 80 : false;

    if (groupApplied && !lowScore) return [];

    return group.items.filter((item) => !isHelperItemApplied(item)).slice(0, group.title === "비율" ? 1 : 2);
  }

  function appendPromptHelper(item: PromptHelperItem) {
    setGenerationPrompt((current) => {
      const trimmed = current.trim();
      if (isHelperItemApplied(item, current) || trimmed.includes(item.sentence)) return current;
      const separator = trimmed.endsWith(".") || trimmed.endsWith("。") ? " " : trimmed ? ". " : "";
      return `${trimmed}${separator}${item.sentence}`;
    });
  }

  function appendRecommendedHelpers() {
    const recommendedItems = PROMPT_HELPERS.flatMap((group) => getRecommendedItems(group));
    if (!recommendedItems.length) return;

    setGenerationPrompt((current) => {
      const additions = recommendedItems
        .filter((item) => !isHelperItemApplied(item, current) && !current.includes(item.sentence))
        .map((item) => item.sentence);

      if (!additions.length) return current;

      const trimmed = current.trim();
      const separator = trimmed.endsWith(".") || trimmed.endsWith("。") ? " " : trimmed ? ". " : "";
      return `${trimmed}${separator}${additions.join(" ")}`;
    });
  }

  function setImageAspectRatio(e: React.SyntheticEvent<HTMLImageElement>) {
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      img.style.aspectRatio = `${img.naturalWidth} / ${img.naturalHeight}`;
    }
  }

  const diff = practiceResult ? practiceResult.total - result.total : 0;
  const recommendedGroups = PROMPT_HELPERS.map((group) => ({
    ...group,
    applied: isHelperGroupApplied(group),
    recommendedItems: getRecommendedItems(group),
  }));
  const recommendedItemCount = recommendedGroups.reduce((sum, group) => sum + group.recommendedItems.length, 0);

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

          <div className={s.promptHelperPanel}>
            <div className={s.promptHelperIntro}>
              <div>
                <span>프롬프트 보조 도구</span>
                <small>현재 생성 프롬프트를 보고 부족해 보이는 요소를 추천해요.</small>
              </div>
              <button
                type="button"
                className={s.addRecommendedBtn}
                onClick={appendRecommendedHelpers}
                disabled={recommendedItemCount === 0}
              >
                {recommendedItemCount > 0 ? `추천 ${recommendedItemCount}개 추가` : "필수 요소 적용됨"}
              </button>
            </div>
            <div className={`${s.recommendationSummary} ${recommendedItemCount === 0 ? s.recommendationSummaryDone : ""}`}>
              {recommendedItemCount > 0
                ? "추천 표시가 있는 요소를 추가하면 이미지 결과가 더 명확해질 수 있어요."
                : "현재 프롬프트에는 기본 요소가 잘 들어가 있어요. 원하는 느낌이 있으면 아래에서 더 추가해보세요."}
            </div>
            <div className={s.promptHelperGrid}>
              {recommendedGroups.map((group) => (
                <div
                  className={`${s.promptHelperGroup} ${group.recommendedItems.length > 0 ? s.promptHelperGroupRecommended : ""}`}
                  key={group.title}
                >
                  <div className={s.promptHelperHeader}>
                    <div>
                      <span>{group.title}</span>
                      {group.recommendedItems.length > 0 ? (
                        <strong>추천</strong>
                      ) : group.applied ? (
                        <strong data-done>적용됨</strong>
                      ) : null}
                    </div>
                    <small>{group.desc}</small>
                  </div>
                  <div className={s.promptHelperChips}>
                    {group.items.map((item) => {
                      const applied = isHelperItemApplied(item);
                      const recommended = group.recommendedItems.includes(item);

                      return (
                        <button
                          key={item.label}
                          type="button"
                          className={`${s.promptHelperChip} ${recommended ? s.promptHelperChipRecommended : ""} ${applied ? s.promptHelperChipApplied : ""}`}
                          onClick={() => appendPromptHelper(item)}
                          disabled={applied}
                        >
                          {recommended && <span>추천</span>}
                          {applied && <span>적용됨</span>}
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
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
