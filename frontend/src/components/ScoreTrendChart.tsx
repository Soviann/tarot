import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RecentScoreEntry } from "../types/api";

interface ScoreTrendChartProps {
  data: RecentScoreEntry[];
}

export default function ScoreTrendChart({ data }: ScoreTrendChartProps) {
  if (data.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-text-muted">
        Aucune donnée disponible
      </p>
    );
  }

  // Data arrives DESC from API (newest first) — reverse for chronological display
  const chartData = [...data].reverse().map((d, i) => ({
    index: i + 1,
    score: d.score,
  }));

  return (
    <ResponsiveContainer height={200} width="100%">
      <LineChart data={chartData} margin={{ bottom: 0, left: 0, right: 16, top: 8 }}>
        <XAxis
          dataKey="index"
          tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
        />
        <YAxis
          tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
          width={40}
        />
        <Tooltip
          contentStyle={{
            background: "var(--color-surface-elevated)",
            border: "1px solid var(--color-surface-border)",
            borderRadius: "0.5rem",
            color: "var(--color-text-primary)",
          }}
          formatter={(value) => [String(value), "Score"]}
          labelFormatter={(label) => `Donne ${label}`}
        />
        <ReferenceLine stroke="var(--color-text-muted)" strokeDasharray="3 3" y={0} />
        <Line
          dataKey="score"
          dot={{ fill: "var(--color-accent-400)", r: 3 }}
          stroke="var(--color-accent-400)"
          strokeWidth={2}
          type="monotone"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
