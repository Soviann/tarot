import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { ContractDistributionEntry } from "../types/api";
import { Contract } from "../types/enums";

interface ContractDistributionChartProps {
  data: ContractDistributionEntry[];
}

const contractLabels: Record<string, string> = {
  [Contract.Garde]: "Garde",
  [Contract.GardeContre]: "G. Contre",
  [Contract.GardeSans]: "G. Sans",
  [Contract.Petite]: "Petite",
};

const contractColors: Record<string, string> = {
  [Contract.Garde]: "var(--color-contract-garde)",
  [Contract.GardeContre]: "var(--color-contract-garde-contre)",
  [Contract.GardeSans]: "var(--color-contract-garde-sans)",
  [Contract.Petite]: "var(--color-contract-petite)",
};

export default function ContractDistributionChart({ data }: ContractDistributionChartProps) {
  if (data.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-text-muted">
        Aucune donnée disponible
      </p>
    );
  }

  const chartData = data.map((d) => ({
    color: contractColors[d.contract] ?? "var(--color-accent-400)",
    name: contractLabels[d.contract] ?? d.contract,
    percentage: d.percentage,
    value: d.count,
  }));

  return (
    <div className="h-52 lg:h-72">
      <ResponsiveContainer height="100%" minHeight={0} minWidth={0} width="100%">
        <PieChart>
          <Pie
            cx="50%"
            cy="50%"
            data={chartData}
            dataKey="value"
            innerRadius="40%"
            nameKey="name"
            outerRadius="70%"
          >
            {chartData.map((entry) => (
              <Cell fill={entry.color} key={entry.name} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "var(--color-surface-elevated)",
              border: "1px solid var(--color-surface-border)",
              borderRadius: "0.5rem",
              color: "var(--color-text-primary)",
            }}
            formatter={(value?: number, _name?: string, props?) => {
              if (value === undefined) return [];
              return [
                `${value} (${(props?.payload as { percentage: number })?.percentage ?? 0}%)`,
                "Donnes",
              ];
            }}
          />
          <Legend
            formatter={(value: string, entry) => {
              const count = (entry as { payload?: { value?: number } }).payload?.value ?? 0;
              return (
                <span className="text-xs text-text-secondary">{value} ({count})</span>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
