import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Game, GamePlayer } from "../types/api";
import { GameStatus } from "../types/enums";

interface ScoreEvolutionChartProps {
  games: Game[];
  players: GamePlayer[];
}

const playerColors = [
  "var(--color-avatar-0)",
  "var(--color-avatar-1)",
  "var(--color-avatar-2)",
  "var(--color-avatar-3)",
  "var(--color-avatar-4)",
];

export function computeScoreEvolution(
  games: Game[],
  players: GamePlayer[],
): Record<string, number | string>[] {
  const completed = games
    .filter((g) => g.status === GameStatus.Completed)
    .sort((a, b) => a.position - b.position);

  const cumulative: Record<number, number> = {};
  players.forEach((p) => (cumulative[p.id] = 0));

  return completed.map((game) => {
    const point: Record<string, number | string> = { position: game.position };
    game.scoreEntries.forEach((entry) => {
      cumulative[entry.player.id] = (cumulative[entry.player.id] ?? 0) + entry.score;
      point[entry.player.name] = cumulative[entry.player.id];
    });
    return point;
  });
}

export default function ScoreEvolutionChart({ games, players }: ScoreEvolutionChartProps) {
  const data = computeScoreEvolution(games, players);

  if (data.length < 2) {
    return null;
  }

  return (
    <div className="h-64 lg:h-96">
      <ResponsiveContainer height="100%" width="100%">
        <LineChart data={data} margin={{ bottom: 0, left: 0, right: 16, top: 8 }}>
          <XAxis
            dataKey="position"
            tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
          />
          <YAxis
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
            labelFormatter={(label) => `Donne ${label}`}
          />
          <ReferenceLine stroke="var(--color-text-muted)" strokeDasharray="3 3" y={0} />
          {players.map((player, index) => (
            <Line
              dataKey={player.name}
              dot={{ fill: playerColors[index % playerColors.length], r: 3 }}
              key={player.id}
              stroke={playerColors[index % playerColors.length]}
              strokeWidth={2}
              type="monotone"
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
