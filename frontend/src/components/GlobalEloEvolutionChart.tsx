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
import type { EloEvolutionPlayer } from "../types/api";

const avatarColors = [
  "var(--color-avatar-0)",
  "var(--color-avatar-1)",
  "var(--color-avatar-2)",
  "var(--color-avatar-3)",
  "var(--color-avatar-4)",
];

interface GlobalEloEvolutionChartProps {
  data: EloEvolutionPlayer[];
}

export function buildChartData(
  data: EloEvolutionPlayer[],
): Record<string, number | null | string>[] {
  if (data.length === 0) return [];

  // Collect all unique gameIds in order
  const gameIds: number[] = [];
  const gameIdSet = new Set<number>();
  for (const player of data) {
    for (const entry of player.history) {
      if (!gameIdSet.has(entry.gameId)) {
        gameIdSet.add(entry.gameId);
        gameIds.push(entry.gameId);
      }
    }
  }

  // Build per-player lookup: gameId → ratingAfter
  // Uses playerName as key (unique per backend validation)
  const playerLookups = data.map((player) => {
    const lookup = new Map<number, number>();
    for (const entry of player.history) {
      lookup.set(entry.gameId, entry.ratingAfter);
    }
    return { lookup, name: player.playerName };
  });

  return gameIds.map((gameId, index) => {
    const point: Record<string, number | null | string> = {
      gameIndex: index + 1,
    };
    for (const { lookup, name } of playerLookups) {
      point[name] = lookup.get(gameId) ?? null;
    }
    return point;
  });
}

export default function GlobalEloEvolutionChart({
  data,
}: GlobalEloEvolutionChartProps) {
  const [hiddenPlayers, setHiddenPlayers] = useState<Set<number>>(new Set());

  // Pre-compute color map: playerId → color (custom or avatar fallback)
  const playerColorMap = useMemo(
    () =>
      new Map(
        data.map((p, i) => [
          p.playerId,
          p.playerColor ?? avatarColors[i % avatarColors.length],
        ]),
      ),
    [data],
  );

  const chartData = useMemo(() => buildChartData(data), [data]);

  if (data.length === 0) return null;

  const visiblePlayers = data.filter((p) => !hiddenPlayers.has(p.playerId));

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
        {data.map((player) => {
          const color = playerColorMap.get(player.playerId)!;
          const isHidden = hiddenPlayers.has(player.playerId);
          return (
            <button
              className={`rounded-full px-3 py-1 text-xs font-medium transition-opacity ${
                isHidden ? "opacity-40" : ""
              }`}
              key={player.playerId}
              onClick={() => togglePlayer(player.playerId)}
              style={{
                backgroundColor: isHidden ? undefined : color,
                border: `2px solid ${color}`,
                color: isHidden ? color : "#fff",
              }}
              type="button"
            >
              {player.playerName}
            </button>
          );
        })}
      </div>
      <div className="h-64 lg:h-96">
        <ResponsiveContainer height="100%" width="100%">
          <LineChart
            data={chartData}
            margin={{ bottom: 0, left: 0, right: 16, top: 8 }}
          >
            <XAxis
              dataKey="gameIndex"
              tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
            />
            <YAxis
              domain={["dataMin - 50", "dataMax + 50"]}
              tick={{ fill: "var(--color-text-muted)", fontSize: 11 }}
              width={50}
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
            <ReferenceLine
              label={{
                fill: "var(--color-text-muted)",
                fontSize: 10,
                position: "right",
                value: "1500",
              }}
              stroke="var(--color-text-muted)"
              strokeDasharray="3 3"
              y={1500}
            />
            {visiblePlayers.map((player) => {
              const color = playerColorMap.get(player.playerId)!;
              return (
                <Line
                  connectNulls
                  dataKey={player.playerName}
                  dot={{ fill: color, r: 3 }}
                  key={player.playerId}
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
