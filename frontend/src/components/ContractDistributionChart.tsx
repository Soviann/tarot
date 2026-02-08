import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
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
    count: d.count,
    fill: contractColors[d.contract] ?? "var(--color-accent-400)",
    name: contractLabels[d.contract] ?? d.contract,
    percentage: d.percentage,
  }));

  return (
    <div className="h-52 lg:h-72">
      <ResponsiveContainer height="100%" width="100%">
        <BarChart data={chartData} layout="vertical" margin={{ bottom: 0, left: 0, right: 16, top: 0 }}>
          <XAxis hide type="number" />
          <YAxis
            dataKey="name"
            tick={{ fill: "var(--color-text-secondary)", fontSize: 12 }}
            type="category"
            width={70}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface-elevated)",
              border: "1px solid var(--color-surface-border)",
              borderRadius: "0.5rem",
              color: "var(--color-text-primary)",
            }}
            formatter={(value, _name, props) => [
              `${value} (${(props.payload as { percentage: number }).percentage}%)`,
              "Donnes",
            ]}
          />
          <Bar barSize={20} dataKey="count" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
