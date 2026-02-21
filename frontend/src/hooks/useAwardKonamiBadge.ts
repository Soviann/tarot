import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../services/api";
import type { Badge } from "../types/api";

interface KonamiResponse {
  badge: Badge;
  newBadges: Badge[];
}

export function useAwardKonamiBadge(playerId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiFetch<KonamiResponse | null>(`/players/${playerId}/konami`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["playerStats", playerId] });
    },
  });
}
