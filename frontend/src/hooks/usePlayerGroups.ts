import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../services/api";
import type { HydraCollection, PlayerGroup } from "../types/api";

export function usePlayerGroups() {
  const query = useQuery({
    queryFn: () => apiFetch<HydraCollection<PlayerGroup>>("/player-groups"),
    queryKey: ["player-groups"],
    select: (data) => data.member,
  });

  return {
    ...query,
    groups: query.data ?? [],
  };
}
