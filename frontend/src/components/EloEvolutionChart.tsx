import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EloHistoryEntry } from "../types/api";

interface EloEvolutionChartProps {
  data: EloHistoryEntry[];
}

export default function EloEvolutionChart({ data }: EloEvolutionChartProps) {
  if (data.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-text-muted">
        Aucune donnée disponible
      </p>
    );
  }

  const chartData = data.map((d, i) => ({
    change: d.ratingChange,
    index: i + 1,
    rating: d.ratingAfter,
  }));

  return (
    <div className="h-52 lg:h-96">
      <ResponsiveContainer height="100%" width="100%">
        <LineChart data={chartData} margin={{ bottom: 0, left: 0, right: 16, top: 8 }}>
          <XAxis
            dataKey="index"
            tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
          />
          <YAxis
            domain={["dataMin - 50", "dataMax + 50"]}
            tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
            width={45}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface-elevated)",
              border: "1px solid var(--color-surface-border)",
              borderRadius: "0.5rem",
              color: "var(--color-text-primary)",
            }}
            formatter={(value, _name, props) => {
              const change = props.payload.change as number;
              const sign = change >= 0 ? "+" : "";
              return [
                `${String(value)} (${sign}${change})`,
                "ELO",
              ];
            }}
            labelFormatter={(label) => `Donne ${label}`}
          />
          <ReferenceLine
            label={{ fill: "var(--color-text-muted)", fontSize: 10, position: "right", value: "1500" }}
            stroke="var(--color-text-muted)"
            strokeDasharray="3 3"
            y={1500}
          />
          <Line
            dataKey="rating"
            dot={{ fill: "var(--color-accent-400)", r: 3 }}
            stroke="var(--color-accent-400)"
            strokeWidth={2}
            type="monotone"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
