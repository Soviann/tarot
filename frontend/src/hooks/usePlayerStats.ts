import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../services/api";
import type { PlayerStatistics } from "../types/api";

export function usePlayerStats(id: number) {
  const query = useQuery({
    enabled: !Number.isNaN(id),
    queryFn: () => apiFetch<PlayerStatistics>(`/statistics/players/${id}`),
    queryKey: ["statistics", "player", id],
  });

  return {
    ...query,
    stats: query.data ?? null,
  };
}
