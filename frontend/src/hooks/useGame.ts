import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../services/api";
import type { Game } from "../types/api";

export function useGame(gameId: number | null) {
  return useQuery({
    enabled: gameId !== null,
    queryFn: () => apiFetch<Game>(`/games/${gameId}`),
    queryKey: ["games", gameId],
  });
}
