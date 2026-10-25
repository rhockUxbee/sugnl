import type { CSSProperties } from "react";

const colors = ["#6366f1", "#3b82f6", "#38bdf8", "#22c55e", "#facc15", "#f472b6"];

// Index-derived spread instead of Math.random so renders stay pure.
const pieces = Array.from({ length: 80 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  background: colors[i % colors.length],
  "--confetti-delay": `${(i * 53) % 800}ms`,
  "--confetti-duration": `${2200 + ((i * 71) % 1600)}ms`,
  "--confetti-spin": `${(i % 2 ? 1 : -1) * (360 + ((i * 97) % 540))}deg`,
} as CSSProperties));

/** Plays once on mount; hidden for people who prefer reduced motion. */
export default function Confetti() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {pieces.map((style, i) => (
        <span key={i} className="confetti-piece" style={style} />
      ))}
    </div>
  );
}
