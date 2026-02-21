import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../services/api";
import type { GlobalStatistics } from "../types/api";

export function useGlobalStats(
  playerGroupId?: number | null,
  from?: string | null,
  to?: string | null,
) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (playerGroupId) params.set("playerGroup", String(playerGroupId));
  if (to) params.set("to", to);

  const qs = params.toString();
  const path = `/statistics${qs ? `?${qs}` : ""}`;

  const query = useQuery({
    queryFn: () => apiFetch<GlobalStatistics>(path),
    queryKey: ["statistics", { from: from ?? null, playerGroupId: playerGroupId ?? null, to: to ?? null }],
  });

  return {
    ...query,
    stats: query.data ?? null,
  };
}
