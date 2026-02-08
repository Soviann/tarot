import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../services/api";
import type { Session } from "../types/api";

export function useUpdateDealer(sessionId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (playerId: number) =>
      apiFetch<Session>(`/sessions/${sessionId}`, {
        body: JSON.stringify({ currentDealer: `/api/players/${playerId}` }),
        headers: { "Content-Type": "application/merge-patch+json" },
        method: "PATCH",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
    },
  });
}
