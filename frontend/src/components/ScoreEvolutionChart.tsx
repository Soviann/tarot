import { useMemo, useState } from "react";
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
import { PLAYER_PALETTE } from "./ui/PlayerAvatar";

interface ScoreEvolutionChartProps {
  games: Game[];
  players: GamePlayer[];
}

export function computeScoreEvolution(
  games: Game[],
  players: GamePlayer[],
): Record<string, number | string>[] {
  const completed = [...games]
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
  const [hiddenPlayers, setHiddenPlayers] = useState<Set<number>>(new Set());

  const playerColorMap = useMemo(
    () =>
      new Map(
        players.map((p) => [
          p.id,
          p.color ?? PLAYER_PALETTE[p.id % PLAYER_PALETTE.length],
        ]),
      ),
    [players],
  );

  const data = useMemo(
    () => computeScoreEvolution(games, players).slice(-10),
    [games, players],
  );

  if (data.length < 2) {
    return null;
  }

  const visiblePlayers = players.filter((p) => !hiddenPlayers.has(p.id));

  const togglePlayer = (playerId: number) => {
    setHiddenPlayers((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }
      return next;
    });
  };

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {players.map((player) => {
          const color = playerColorMap.get(player.id)!;
          const isHidden = hiddenPlayers.has(player.id);
          return (
            <button
              className={`rounded-full px-3 py-1 text-xs font-medium transition-opacity ${
                isHidden ? "opacity-40" : ""
              }`}
              key={player.id}
              onClick={() => togglePlayer(player.id)}
              style={{
                backgroundColor: isHidden ? undefined : color,
                border: `2px solid ${color}`,
                color: isHidden ? color : "#fff",
              }}
              type="button"
            >
              {player.name}
            </button>
          );
        })}
      </div>
      <div className="h-64 lg:h-96">
        <ResponsiveContainer height="100%" minHeight={0} minWidth={0} width="100%">
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
            {visiblePlayers.map((player) => {
              const color = playerColorMap.get(player.id)!;
              return (
                <Line
                  dataKey={player.name}
                  dot={{ fill: color, r: 3 }}
                  key={player.id}
                  stroke={color}
                  strokeWidth={2}
                  type="monotone"
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
