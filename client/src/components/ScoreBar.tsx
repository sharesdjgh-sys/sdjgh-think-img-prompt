import s from "./ScoreBar.module.css";

interface Props {
  label: string;
  score: number;
  feedback: string;
  index: number;
}

const COLORS = [
  { main: "#6366f1", bg: "#eef2ff", border: "#c7d2fe", track: "#c7d2fe" },
  { main: "#0ea5e9", bg: "#f0f9ff", border: "#bae6fd", track: "#bae6fd" },
  { main: "#10b981", bg: "#f0fdf4", border: "#bbf7d0", track: "#bbf7d0" },
  { main: "#f59e0b", bg: "#fffbeb", border: "#fde68a", track: "#fde68a" },
  { main: "#ec4899", bg: "#fdf2f8", border: "#fbcfe8", track: "#fbcfe8" },
];


function getGrade(score: number) {
  if (score >= 80) return { text: "우수", color: "#10b981" };
  if (score >= 60) return { text: "양호", color: "#0ea5e9" };
  if (score >= 40) return { text: "보통", color: "#f59e0b" };
  return { text: "부족", color: "#ef4444" };
}

const R = 20;
const CIRC = 2 * Math.PI * R;

export default function ScoreBar({ label, score, feedback, index }: Props) {
  const c = COLORS[index % COLORS.length];
  const grade = getGrade(score);
  const offset = CIRC - (score / 100) * CIRC;

  return (
    <div className={s.card} style={{ borderColor: c.border, background: c.bg }}>

      {/* 왼쪽: 점수·라벨·등급·바 */}
      <div className={s.leftCol}>
        <div className={s.leftTop}>
          <svg width="56" height="56" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r={R} fill="none" stroke={c.track} strokeWidth="3.5" />
            <circle
              cx="28" cy="28" r={R}
              fill="none"
              stroke={c.main}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={offset}
              transform="rotate(-90 28 28)"
              style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.16, 1, 0.3, 1)" }}
            />
            <text x="28" y="28" textAnchor="middle" dominantBaseline="central"
              style={{ fontSize: "12px", fontWeight: 800, fill: c.main, fontFamily: "inherit" }}>
              {score}
            </text>
          </svg>
          <div className={s.meta}>
            <p className={s.label}>{label}</p>
            <span className={s.grade} style={{ color: grade.color, background: grade.color + "18" }}>
              {grade.text}
            </span>
          </div>
        </div>
        <div className={s.bar}>
          <div className={s.barFill} style={{ width: `${score}%`, background: c.main }} />
        </div>
      </div>

      {/* 오른쪽: 피드백 텍스트 */}
      <div className={s.rightCol}>
        <p className={s.feedback}>{feedback}</p>
      </div>

    </div>
  );
}
