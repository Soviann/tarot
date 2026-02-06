import { useAnimatedCounter } from "../../hooks/useAnimatedCounter";

interface ScoreDisplayProps {
  animated?: boolean;
  className?: string;
  duration?: number;
  value: number;
}

function formatScore(value: number): string {
  if (value > 0) return `+${value}`;
  return String(value);
}

function getColorClass(value: number): string {
  if (value > 0) return "text-score-positive";
  if (value < 0) return "text-score-negative";
  return "text-text-muted";
}

export default function ScoreDisplay({
  animated = true,
  className = "",
  duration = 500,
  value,
}: ScoreDisplayProps) {
  const displayed = useAnimatedCounter(value, { animated, duration });

  return (
    <span
      className={`${getColorClass(value)} tabular-nums font-semibold ${className}`.trim()}
    >
      {formatScore(displayed)}
    </span>
  );
}
