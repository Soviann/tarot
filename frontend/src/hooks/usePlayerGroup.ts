import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../services/api";
import type { PlayerGroupDetail } from "../types/api";

export function usePlayerGroup(id: number) {
  const query = useQuery({
    enabled: !Number.isNaN(id),
    queryFn: () => apiFetch<PlayerGroupDetail>(`/player-groups/${id}`),
    queryKey: ["player-groups", id],
  });

  return {
    ...query,
    group: query.data ?? null,
  };
}
