// Think Prompt — 시스템 프롬프트 테스트 스크립트
import "dotenv/config";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// ─────────────────────────────────────────
// 채팅 AI 분석 시스템 프롬프트
// ─────────────────────────────────────────
const CHAT_SYSTEM_PROMPT = `당신은 고등학생의 AI 프롬프트를 분석하고 교육하는 전문가입니다.
학생이 입력한 프롬프트를 5가지 기준으로 평가하고, 친절하고 구체적인 피드백을 제공하세요.

## 평가 기준 (각 0~100점)

1. **명확성 (Clarity)**: 무엇을 원하는지 분명하게 표현되어 있는가?
2. **맥락 (Context)**: 충분한 배경 정보가 포함되어 있는가?
3. **범위 (Scope)**: 요청의 범위가 적절한가?
4. **형식 지정 (Format)**: 원하는 출력 형태를 명시했는가?
5. **역할 부여 (Role)**: AI에게 적절한 역할이나 관점을 제시했는가?

## 출력 형식

반드시 아래 JSON 구조로만 응답하세요. JSON 외 텍스트는 절대 포함하지 마세요.

{
  "scores": {
    "clarity": <0-100 정수>,
    "context": <0-100 정수>,
    "scope": <0-100 정수>,
    "format": <0-100 정수>,
    "role": <0-100 정수>
  },
  "total": <5개 평균, 정수>,
  "overall_comment": "<전체적인 한 줄 평가. 학생에게 직접 말하는 말투로.>",
  "feedback": {
    "clarity": "<이 항목의 점수 이유와 개선 방향을 2문장으로>",
    "context": "<이 항목의 점수 이유와 개선 방향을 2문장으로>",
    "scope": "<이 항목의 점수 이유와 개선 방향을 2문장으로>",
    "format": "<이 항목의 점수 이유와 개선 방향을 2문장으로>",
    "role": "<이 항목의 점수 이유와 개선 방향을 2문장으로>"
  },
  "improved_prompt": "<학생의 의도를 유지하면서 5가지 기준을 모두 반영한 개선된 프롬프트>",
  "changes": [
    { "what": "<변경한 내용>", "why": "<변경한 이유>" }
  ],
  "tip": "<이 학생에게 가장 도움이 될 프롬프트 작성 팁 한 가지>"
}

피드백은 비판적이지 않고 격려하는 톤으로 작성하세요.
고등학생이 이해할 수 있는 쉬운 언어를 사용하세요.`;

// ─────────────────────────────────────────
// 테스트 케이스
// ─────────────────────────────────────────
const TEST_CASES = [
  {
    label: "케이스 1 — 매우 짧은 프롬프트",
    input: "광합성 알려줘",
  },
  {
    label: "케이스 2 — 중간 수준",
    input: "임진왜란에 대해 자세히 설명해줘. 원인, 전개, 결과 순서로 알려줘",
  },
  {
    label: "케이스 3 — 잘 작성된 프롬프트",
    input:
      "나는 고등학교 2학년이고, 내일 한국사 수행평가에서 임진왜란을 발표해야 해. 선생님처럼 설명해줘. 원인, 전개, 결과를 각각 3줄 이내로 요약하고, 중요 키워드는 굵게 표시해줘.",
  },
];

// ─────────────────────────────────────────
// 분석 실행
// ─────────────────────────────────────────
async function analyzePrompt(userPrompt) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: CHAT_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text = response.content[0].text.replace(/^```json\s*|```$/g, "").trim();
  return JSON.parse(text);
}

function printResult(label, input, result) {
  console.log("\n" + "=".repeat(60));
  console.log(`📝 ${label}`);
  console.log(`입력: "${input}"`);
  console.log("-".repeat(60));

  const scores = result.scores;
  const labels = {
    clarity: "명확성",
    context: "맥락  ",
    scope: "범위  ",
    format: "형식  ",
    role: "역할  ",
  };

  for (const [key, score] of Object.entries(scores)) {
    const bar = "█".repeat(Math.floor(score / 10)) + "░".repeat(10 - Math.floor(score / 10));
    console.log(`  ${labels[key]}  ${bar} ${score}점`);
  }

  console.log(`\n  총점: ${result.total}점`);
  console.log(`\n  총평: ${result.overall_comment}`);
  console.log(`\n  💡 팁: ${result.tip}`);
  console.log(`\n  ✨ 개선 프롬프트:\n  "${result.improved_prompt}"`);
  console.log("\n  변경 내역:");
  result.changes.forEach((c) => {
    console.log(`    • [${c.what}] → ${c.why}`);
  });
}

async function runTests() {
  console.log("Think Prompt — 분석 엔진 테스트 시작\n");

  for (const tc of TEST_CASES) {
    try {
      const result = await analyzePrompt(tc.input);
      printResult(tc.label, tc.input, result);
    } catch (err) {
      console.error(`❌ ${tc.label} 실패:`, err.message);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("테스트 완료");
}

runTests();
