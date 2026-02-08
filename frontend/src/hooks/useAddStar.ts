import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../services/api";
import type { StarEvent } from "../types/api";

export function useAddStar(sessionId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (playerId: number) =>
      apiFetch<StarEvent>(`/sessions/${sessionId}/star-events`, {
        body: JSON.stringify({
          player: `/api/players/${playerId}`,
        }),
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
    },
  });
}
