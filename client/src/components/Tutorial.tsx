import { useState } from "react";
import s from "./Tutorial.module.css";

interface Props {
  onStart: () => void;
}

const QUIZ = [
  {
    context: "판타지 숲 속 요정 이미지를 만들고 싶을 때",
    A: "요정 그려줘",
    B: 'a delicate fairy in an enchanted forest, soft watercolor style, dappled sunlight, close-up portrait, pastel green and gold tones',
    answer: "B" as const,
    why: "B는 주제(요정), 배경(숲), 스타일(수채화), 조명(역광), 구도(클로즈업)까지 모두 담아 AI가 원하는 이미지를 정확히 생성할 수 있어요.",
  },
  {
    context: "미래 도시 야경 이미지를 원할 때",
    A: "미래 도시 야경",
    B: "futuristic city at night, neon lights reflecting on wet streets, wide angle shot, cinematic lighting, 8k, highly detailed",
    answer: "B" as const,
    why: "B는 분위기(네온 불빛), 구도(광각), 조명(시네마틱), 품질(8k)을 명확히 지정해 훨씬 풍부한 이미지를 얻을 수 있어요.",
  },
];

const CRITERIA = [
  {
    icon: "solar:target-bold",
    label: "주제 명확성",
    color: "#6366f1",
    border: "#c7d2fe",
    desc: "그릴 대상·배경·행동을 구체적으로",
    example: '"고양이 그려줘" → "창가에 앉은 흰 고양이, 오후 햇살"',
  },
  {
    icon: "solar:palette-bold",
    label: "스타일",
    color: "#0ea5e9",
    border: "#bae6fd",
    desc: "화풍·분위기·색감 지정하기",
    example: '"수채화 스타일, 파스텔 색감, 몽환적인 분위기"',
  },
  {
    icon: "solar:camera-bold",
    label: "구도와 시점",
    color: "#10b981",
    border: "#bbf7d0",
    desc: "앵글·거리감(클로즈업/원경) 넣기",
    example: '"close-up portrait", "wide angle", "bird\'s eye view"',
  },
  {
    icon: "solar:sun-bold",
    label: "조명과 품질",
    color: "#f59e0b",
    border: "#fde68a",
    desc: "조명 방향·분위기·품질 태그 포함",
    example: '"soft morning light, 8k, highly detailed, masterpiece"',
  },
  {
    icon: "solar:forbidden-circle-bold",
    label: "부정 프롬프트",
    color: "#ec4899",
    border: "#fbcfe8",
    desc: "원하지 않는 요소 제외하기",
    example: '"blurry, deformed, low quality, watermark" 제외',
  },
];

const FEATURES = [
  {
    icon: "solar:chart-square-bold",
    title: "5가지 기준 점수 분석",
    desc: "주제·스타일·구도·조명·부정 프롬프트. 내 프롬프트가 어디서 부족한지 바로 알 수 있어요.",
  },
  {
    icon: "solar:magic-stick-3-bold",
    title: "한글 개선안 + 영문 참고안 제안",
    desc: "학생이 이해하기 쉬운 한국어 개선 프롬프트와 영문 참고안, 추천 부정 프롬프트를 함께 제시해드려요.",
  },
  {
    icon: "solar:pen-new-round-bold",
    title: "직접 다시 써보기",
    desc: "피드백을 보고 직접 고쳐보면 점수가 올랐는지 바로 확인할 수 있어요.",
  },
];

export default function Tutorial({ onStart }: Props) {
  // step 0 = welcome, step 1~5 = tutorial
  const [step, setStep] = useState(0);
  const [quizIdx, setQuizIdx] = useState(0);
  const [picked, setPicked] = useState<"A" | "B" | null>(null);
  const [correct, setCorrect] = useState(0);
  const [allDone, setAllDone] = useState(false);

  function pickAnswer(opt: "A" | "B") {
    if (picked !== null) return;
    if (opt === QUIZ[quizIdx].answer) setCorrect((c) => c + 1);
    setPicked(opt);
  }

  function nextQuestion() {
    if (quizIdx < QUIZ.length - 1) {
      setQuizIdx((i) => i + 1);
      setPicked(null);
    } else {
      setAllDone(true);
    }
  }

  function goToStep(n: number) {
    if (n === 4) {
      setQuizIdx(0);
      setPicked(null);
      setCorrect(0);
      setAllDone(false);
    }
    setStep(n);
  }

  const q = QUIZ[quizIdx];
  const isCorrect = picked === q?.answer;

  /* ── Welcome screen ── */
  if (step === 0) {
    return (
      <div className={s.welcomePage}>
        <div className={s.welcomeContainer}>

          <div className={s.welcomeLeft}>
            <div className={s.welcomeBadge}>이미지 AI 프롬프트 학습 도우미</div>
            <h1 className={s.welcomeTitle}>
              이미지가<br />
              달라지는<br />
              프롬프트의 차이
            </h1>
            <p className={s.welcomeDesc}>
              같은 주제라도 프롬프트를 어떻게 쓰느냐에 따라<br />
              AI가 만드는 이미지가 완전히 달라집니다.<br />
              Think Prompt가 내 프롬프트를 분석하고<br />
              더 나은 방법을 알려드려요.
            </p>

            <div className={s.welcomeActions}>
              <button className={s.welcomeBtnPrimary} onClick={() => setStep(1)}>
                <iconify-icon icon="solar:book-2-bold" width="16" height="16" />
                1분 튜토리얼 시작
              </button>
              <button className={s.welcomeBtnSecondary} onClick={onStart}>
                바로 시작하기
                <iconify-icon icon="solar:arrow-right-bold" width="14" height="14" />
              </button>
            </div>
          </div>

          <div className={s.welcomeRight}>
            {FEATURES.map((f) => (
              <div key={f.title} className={s.featureCard}>
                <div className={s.featureIcon}>
                  <iconify-icon icon={f.icon} width="20" height="20" />
                </div>
                <div>
                  <p className={s.featureTitle}>{f.title}</p>
                  <p className={s.featureDesc}>{f.desc}</p>
                </div>
              </div>
            ))}

            <div className={s.exampleBox}>
              <p className={s.exampleLabel}>직접 보면 바로 알 수 있어요</p>
              <div className={s.exampleRow}>
                <div className={s.exampleBefore}>
                  <span className={s.exampleTag} data-type="before">전</span>
                  <span className={s.exampleText}>"귀여운 고양이 그려줘"</span>
                </div>
                <iconify-icon icon="solar:arrow-right-bold" width="14" height="14" style={{ color: "var(--gray-400)", flexShrink: 0 }} />
                <div className={s.exampleAfter}>
                  <span className={s.exampleTag} data-type="after">후</span>
                  <span className={s.exampleText}>"a cute fluffy white cat on a windowsill, soft watercolor, warm sunlight, close-up, pastel colors, high quality"</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  }

  /* ── Tutorial steps 1–5 ── */
  return (
    <div className={s.page}>
      <div className={s.container}>

        {/* Top bar */}
        <div className={s.topBar}>
          <div className={s.stepDots}>
            {[1, 2, 3, 4, 5].map((n) => (
              <span
                key={n}
                className={`${s.dot} ${n === step ? s.dotActive : n < step ? s.dotDone : ""}`}
              />
            ))}
          </div>
          <button className={s.skipBtn} onClick={onStart}>건너뛰기</button>
        </div>

        {/* Progress bar */}
        <div className={s.progressTrack}>
          <div className={s.progressFill} style={{ width: `${(step / 5) * 100}%` }} />
        </div>

        {/* Card */}
        <div className={s.card}>

          {/* ── Step 1 ── */}
          {step === 1 && (
            <div className={s.stepContent}>
              <div className={s.stepMeta}>
                <span className={s.stepNum}>01</span>
                <span className={s.stepTag}>개념</span>
              </div>
              <h2 className={s.title}>이미지 프롬프트가 뭔가요?</h2>
              <p className={s.desc}>이미지 AI에게 보내는 텍스트 지시를 <strong>프롬프트</strong>라고 해요.</p>

              <div className={s.compareGrid}>
                <div className={s.compareCell}>
                  <div className={s.compareIcon}>
                    <iconify-icon icon="solar:user-bold" width="20" height="20" />
                  </div>
                  <p className={s.compareTitle}>사람 화가에게</p>
                  <p className={s.compareQuote}>"고양이 그려줘"</p>
                  <p className={s.compareNote}>눈치껏 스타일을 맞춰줘요</p>
                </div>
                <div className={s.compareDivider}>
                  <span className={s.vsText}>vs</span>
                </div>
                <div className={s.compareCell}>
                  <div className={s.compareIcon}>
                    <iconify-icon icon="solar:cpu-bolt-bold" width="20" height="20" />
                  </div>
                  <p className={s.compareTitle}>이미지 AI에게</p>
                  <p className={s.compareQuote}>"고양이 그려줘"</p>
                  <p className={s.compareNote}>어떤 고양이인지 몰라요</p>
                </div>
              </div>

              <div className={s.keyPoint}>
                <iconify-icon icon="solar:lightbulb-bolt-bold" width="16" height="16" style={{ color: "var(--primary)", flexShrink: 0 }} />
                <span>AI는 텍스트 그대로만 해석해요. <strong>구체적인 프롬프트 = 원하는 이미지.</strong></span>
              </div>
            </div>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <div className={s.stepContent}>
              <div className={s.stepMeta}>
                <span className={s.stepNum}>02</span>
                <span className={s.stepTag}>비교</span>
              </div>
              <h2 className={s.title}>이런 차이가 있어요</h2>
              <p className={s.desc}>같은 주제라도 프롬프트가 다르면 결과 이미지가 완전히 달라져요.</p>

              <div className={s.diffBlock}>
                <div className={s.diffBadge} data-type="bad">아쉬운 프롬프트</div>
                <p className={s.diffPrompt}>"귀여운 고양이 그려줘"</p>
                <div className={s.diffReaction}>
                  <span className={s.diffReactionLabel}>AI 입장</span>
                  어떤 품종? 배경은? 스타일은? — 임의로 해석해서 기대와 다른 결과를 만들 수 있어요.
                </div>
              </div>

              <div className={s.diffBlock} data-good>
                <div className={s.diffBadge} data-type="good">좋은 프롬프트</div>
                <p className={s.diffPrompt}>
                  "a cute fluffy white cat sitting on a windowsill, soft watercolor style, warm afternoon sunlight, close-up shot, pastel colors, high quality illustration"
                </p>
                <div className={s.diffReaction}>
                  <span className={s.diffReactionLabel}>AI 입장</span>
                  원하는 이미지를 정확하게 생성할 수 있어요.
                </div>
              </div>
            </div>
          )}

          {/* ── Step 3 ── */}
          {step === 3 && (
            <div className={s.stepContent}>
              <div className={s.stepMeta}>
                <span className={s.stepNum}>03</span>
                <span className={s.stepTag}>원칙</span>
              </div>
              <h2 className={s.title}>좋은 이미지 프롬프트의<br />5가지 기준</h2>
              <p className={s.desc}>이 5가지를 넣으면 원하는 이미지에 훨씬 가까워져요.</p>

              <div className={s.criteriaList}>
                {CRITERIA.map((c) => (
                  <div key={c.label} className={s.criteriaRow} style={{ borderLeftColor: c.border }}>
                    <div className={s.criteriaIconWrap} style={{ color: c.color }}>
                      <iconify-icon icon={c.icon} width="18" height="18" />
                    </div>
                    <div className={s.criteriaBody}>
                      <span className={s.criteriaLabel} style={{ color: c.color }}>{c.label}</span>
                      <span className={s.criteriaDesc}>{c.desc}</span>
                      <span className={s.criteriaExample}>{c.example}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 4: Quiz ── */}
          {step === 4 && (
            <div className={s.stepContent}>
              <div className={s.stepMeta}>
                <span className={s.stepNum}>04</span>
                <span className={s.stepTag}>퀴즈</span>
              </div>
              <h2 className={s.title}>어떤 프롬프트가<br />더 나을까요?</h2>

              {!allDone ? (
                <>
                  <div className={s.quizMeta}>
                    <span className={s.quizProgress}>{quizIdx + 1} / {QUIZ.length}</span>
                    <p className={s.quizContext}>{q.context}</p>
                  </div>

                  <div className={s.quizOptions}>
                    {(["A", "B"] as const).map((opt) => {
                      const isPickedOpt = picked === opt;
                      const isAnswerOpt = opt === q.answer;
                      let optClass = s.quizOption;
                      if (picked === null) {
                        optClass = `${s.quizOption} ${s.quizOptionIdle}`;
                      } else if (isPickedOpt && isAnswerOpt) {
                        optClass = `${s.quizOption} ${s.quizOptionCorrect}`;
                      } else if (isPickedOpt && !isAnswerOpt) {
                        optClass = `${s.quizOption} ${s.quizOptionWrong}`;
                      } else if (!isPickedOpt && isAnswerOpt) {
                        optClass = `${s.quizOption} ${s.quizOptionReveal}`;
                      } else {
                        optClass = `${s.quizOption} ${s.quizOptionDim}`;
                      }
                      return (
                        <button key={opt} className={optClass} onClick={() => pickAnswer(opt)} disabled={picked !== null}>
                          <span className={s.quizOptLabel}>{opt}</span>
                          <span className={s.quizOptText}>{q[opt]}</span>
                        </button>
                      );
                    })}
                  </div>

                  {picked !== null && (
                    <div className={`${s.quizFeedback} ${isCorrect ? s.quizFeedbackCorrect : s.quizFeedbackWrong}`}>
                      <div className={s.quizFeedbackTitle}>
                        <iconify-icon icon={isCorrect ? "solar:check-circle-bold" : "solar:close-circle-bold"} width="18" height="18" />
                        {isCorrect ? "정답이에요" : "아쉬워요"}
                      </div>
                      <p className={s.quizFeedbackText}>{q.why}</p>
                      <button className={s.nextQuizBtn} onClick={nextQuestion}>
                        {quizIdx < QUIZ.length - 1 ? "다음 문제" : "결과 보기"}
                        <iconify-icon icon="solar:arrow-right-bold" width="14" height="14" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className={s.quizResult}>
                  <div className={s.quizResultScore}>
                    <span className={s.quizScoreNum}>{correct}</span>
                    <span className={s.quizScoreTotal}>/ {QUIZ.length}</span>
                  </div>
                  <p className={s.quizResultLabel}>
                    {correct === QUIZ.length ? "모두 맞혔어요" : `${QUIZ.length}문제 중 ${correct}개 정답`}
                  </p>
                  <p className={s.quizResultMsg}>
                    {correct === QUIZ.length
                      ? "완벽해요. 이제 직접 프롬프트를 분석해봐요."
                      : "직접 분석하면서 감각을 키워봐요."}
                  </p>
                  <button className={s.primaryBtn} onClick={() => goToStep(5)}>
                    다음 단계로
                    <iconify-icon icon="solar:arrow-right-bold" width="15" height="15" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── Step 5: Start ── */}
          {step === 5 && (
            <div className={s.stepContent}>
              <div className={s.stepMeta}>
                <span className={s.stepNum}>05</span>
                <span className={s.stepTag}>시작</span>
              </div>
              <h2 className={s.title}>이제 직접<br />해봐요</h2>
              <p className={s.desc}>
                사용하던 이미지 프롬프트를 그대로 입력해보세요.<br />
                5가지 기준으로 분석하고 한국어 개선 프롬프트와 영문 참고안을 제안해드려요.
              </p>

              <div className={s.flowList}>
                {["프롬프트 입력", "5가지 분석", "한글 개선안 확인", "직접 다시 써보기"].map((t, i) => (
                  <div key={t} className={s.flowItem}>
                    <span className={s.flowNum}>{i + 1}</span>
                    <span className={s.flowText}>{t}</span>
                  </div>
                ))}
              </div>

              <button className={s.primaryBtn} onClick={onStart}>
                분석 시작하기
                <iconify-icon icon="solar:arrow-right-bold" width="15" height="15" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className={s.navRow}>
          <div>
            {step > 1 && (
              <button className={s.prevBtn} onClick={() => goToStep(step - 1)}>
                <iconify-icon icon="solar:arrow-left-bold" width="14" height="14" />
                이전
              </button>
            )}
            {step === 1 && (
              <button className={s.prevBtn} onClick={() => setStep(0)}>
                <iconify-icon icon="solar:arrow-left-bold" width="14" height="14" />
                처음으로
              </button>
            )}
          </div>
          <div>
            {step < 5 && step !== 4 && (
              <button className={s.nextBtn} onClick={() => goToStep(step + 1)}>
                다음
                <iconify-icon icon="solar:arrow-right-bold" width="14" height="14" />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
