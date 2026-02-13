import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../services/api";
import type { PlayerStatistics } from "../types/api";

export function usePlayerStats(id: number, playerGroupId?: number | null) {
  const path = playerGroupId
    ? `/statistics/players/${id}?playerGroup=${playerGroupId}`
    : `/statistics/players/${id}`;
  const query = useQuery({
    enabled: !Number.isNaN(id),
    queryFn: () => apiFetch<PlayerStatistics>(path),
    queryKey: ["statistics", "player", id, { playerGroupId: playerGroupId ?? null }],
  });

  return {
    ...query,
    stats: query.data ?? null,
  };
}
