import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../services/api";
import type { HydraCollection, Player } from "../types/api";

export function usePlayers(search?: string) {
  const query = useQuery({
    queryFn: () => apiFetch<HydraCollection<Player>>("/players"),
    queryKey: ["players"],
    select: (data) => data.member,
  });

  const players = useMemo(() => {
    const all = query.data ?? [];
    if (!search) return all;
    const term = search.toLowerCase();
    return all.filter((p) => p.name.toLowerCase().includes(term));
  }, [query.data, search]);

  return {
    ...query,
    players,
  };
}
