import { useInfiniteQuery } from "@tanstack/react-query";
import { apiFetch } from "../services/api";
import type { Game, PaginatedCollection } from "../types/api";

export function useSessionGames(sessionId: number) {
  return useInfiniteQuery({
    getNextPageParam: (lastPage: PaginatedCollection<Game>, allPages: PaginatedCollection<Game>[]) => {
      const loadedCount = allPages.reduce((sum, page) => sum + page.member.length, 0);
      return loadedCount < lastPage.totalItems ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      apiFetch<PaginatedCollection<Game>>(`/sessions/${sessionId}/games?page=${pageParam}`),
    queryKey: ["session", sessionId, "games"],
  });
}
