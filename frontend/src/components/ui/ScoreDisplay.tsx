import CountUp from "react-countup";

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
  return (
    <span
      className={`${getColorClass(value)} tabular-nums font-semibold ${className}`.trim()}
    >
      {animated ? (
        <CountUp
          duration={duration / 1000}
          end={value}
          formattingFn={formatScore}
          preserveValue
        />
      ) : (
        formatScore(value)
      )}
    </span>
  );
}
