import type { CriterionKey } from "../lib/criteria";
import { CRITERIA } from "../lib/criteria";
import s from "./ScoreBar.module.css";

interface Props {
  criterion: CriterionKey;
  score: number;
  feedback: string;
}

function getGrade(score: number) {
  if (score >= 80) return { text: "우수", color: "#059669", bg: "#ecfdf5" };
  if (score >= 60) return { text: "양호", color: "#0284c7", bg: "#f0f9ff" };
  if (score >= 40) return { text: "보통", color: "#d97706", bg: "#fffbeb" };
  return { text: "부족", color: "#e11d48", bg: "#fff1f2" };
}

export default function ScoreBar({ criterion, score, feedback }: Props) {
  const c = CRITERIA[criterion];
  const grade = getGrade(score);

  return (
    <div className={s.card}>
      <div className={s.header}>
        <span className={s.iconChip} style={{ background: c.tint, color: c.color }}>
          <iconify-icon icon={c.icon} width="15" height="15" />
        </span>
        <span className={s.label}>{c.label}</span>
        <span className={s.grade} style={{ color: grade.color, background: grade.bg }}>
          {grade.text}
        </span>
        <span className={s.score} style={{ color: c.color }}>
          {score}<small>점</small>
        </span>
      </div>
      <div className={s.bar} style={{ background: `${c.color}1f` }}>
        <div className={s.barFill} style={{ width: `${score}%`, background: c.color }} />
      </div>
      <p className={s.feedback}>{feedback}</p>
    </div>
  );
}
