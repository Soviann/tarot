import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../services/api";
import type { Game, HydraCollection } from "../types/api";

export function useAllSessionGames(sessionId: number) {
  return useQuery({
    queryFn: () =>
      apiFetch<HydraCollection<Game>>(
        `/sessions/${sessionId}/games?pagination=false`,
      ),
    queryKey: ["session", sessionId, "allGames"],
    select: (data) => data.member,
  });
}
