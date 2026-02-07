import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../services/api";

export function useDeleteGame(gameId: number, sessionId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      apiFetch<void>(`/games/${gameId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
    },
  });
}
