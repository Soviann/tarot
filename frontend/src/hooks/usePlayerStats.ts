import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../services/api";
import type { PlayerStatistics } from "../types/api";

export function usePlayerStats(
  id: number,
  playerGroupId?: number | null,
  from?: string | null,
  to?: string | null,
) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (playerGroupId) params.set("playerGroup", String(playerGroupId));
  if (to) params.set("to", to);

  const qs = params.toString();
  const path = `/statistics/players/${id}${qs ? `?${qs}` : ""}`;

  const query = useQuery({
    enabled: !Number.isNaN(id),
    queryFn: () => apiFetch<PlayerStatistics>(path),
    queryKey: ["statistics", "player", id, { from: from ?? null, playerGroupId: playerGroupId ?? null, to: to ?? null }],
  });

  return {
    ...query,
    stats: query.data ?? null,
  };
}
