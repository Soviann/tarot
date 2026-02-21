import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface RoleDistributionChartProps {
  gamesAsDefender: number;
  gamesAsPartner: number;
  gamesAsTaker: number;
}

const ROLE_CONFIG = [
  { color: "var(--color-accent-400)", key: "taker" as const, label: "Preneur" },
  { color: "var(--color-accent-200)", key: "partner" as const, label: "Partenaire" },
  { color: "var(--color-surface-tertiary)", key: "defender" as const, label: "Défenseur" },
];

export default function RoleDistributionChart({
  gamesAsDefender,
  gamesAsPartner,
  gamesAsTaker,
}: RoleDistributionChartProps) {
  const total = gamesAsTaker + gamesAsPartner + gamesAsDefender;

  if (total === 0) {
    return (
      <p className="py-4 text-center text-sm text-text-muted">
        Aucune donnée disponible
      </p>
    );
  }

  const counts: Record<string, number> = {
    defender: gamesAsDefender,
    partner: gamesAsPartner,
    taker: gamesAsTaker,
  };

  const data = ROLE_CONFIG
    .filter((r) => counts[r.key] > 0)
    .map((r) => ({
      color: r.color,
      name: r.label,
      value: counts[r.key],
    }));

  return (
    <div className="h-52 lg:h-72">
      <ResponsiveContainer height="100%" minWidth={0} width="100%">
        <PieChart>
          <Pie
            cx="50%"
            cy="50%"
            data={data}
            dataKey="value"
            innerRadius="40%"
            nameKey="name"
            outerRadius="70%"
          >
            {data.map((entry) => (
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
            formatter={(value?: number) => {
              if (value === undefined) return [];
              return [
                `${value} (${Math.round((value / total) * 1000) / 10}%)`,
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
