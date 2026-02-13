import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../services/api";
import type { GlobalStatistics } from "../types/api";

export function useGlobalStats(playerGroupId?: number | null) {
  const path = playerGroupId
    ? `/statistics?playerGroup=${playerGroupId}`
    : "/statistics";
  const query = useQuery({
    queryFn: () => apiFetch<GlobalStatistics>(path),
    queryKey: ["statistics", { playerGroupId: playerGroupId ?? null }],
  });

  return {
    ...query,
    stats: query.data ?? null,
  };
}
