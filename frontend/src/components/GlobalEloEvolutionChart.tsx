import { ChevronDown } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  "var(--color-avatar-5)",
  "var(--color-avatar-6)",
  "var(--color-avatar-7)",
  "var(--color-avatar-8)",
  "var(--color-avatar-9)",
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setDropdownOpen(false), []);

  useEffect(() => {
    if (!dropdownOpen) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [close, dropdownOpen]);

  // Pre-compute color map: playerId → color (custom or avatar fallback)
  const playerColorMap = useMemo(
    () =>
      new Map(
        data.map((p) => [
          p.playerId,
          p.playerColor ?? avatarColors[p.playerId % avatarColors.length],
        ]),
      ),
    [data],
  );

  const chartData = useMemo(() => buildChartData(data), [data]);

  if (data.length === 0) return null;

  const visiblePlayers = data.filter((p) => !hiddenPlayers.has(p.playerId));
  const visibleCount = visiblePlayers.length;

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
      <div className="relative mb-3" ref={containerRef}>
        <button
          className="inline-flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-elevated px-3 py-1.5 text-xs font-medium text-text-primary"
          onClick={() => setDropdownOpen((prev) => !prev)}
          type="button"
        >
          Joueurs ({visibleCount}/{data.length})
          <ChevronDown size={14} />
        </button>

        {dropdownOpen && (
          <div className="absolute left-0 top-full z-50 mt-1 min-w-40 rounded-lg border border-surface-border bg-surface-elevated py-1 shadow-lg">
            {data.map((player) => {
              const color = playerColorMap.get(player.playerId)!;
              const isVisible = !hiddenPlayers.has(player.playerId);
              return (
                <button
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-text-primary hover:bg-surface-secondary"
                  key={player.playerId}
                  onClick={() => togglePlayer(player.playerId)}
                  type="button"
                >
                  <span
                    className="inline-block size-3 shrink-0 rounded-full"
                    data-testid={`color-indicator-${player.playerName}`}
                    style={{ backgroundColor: color, opacity: isVisible ? 1 : 0.3 }}
                  />
                  <span className={isVisible ? "" : "opacity-40"}>
                    {player.playerName}
                  </span>
                </button>
              );
            })}
          </div>
        )}
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
