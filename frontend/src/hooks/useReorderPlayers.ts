import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../services/api";
import type { SessionDetail } from "../types/api";

export function useReorderPlayers(sessionId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (playerOrder: number[]) =>
      apiFetch<SessionDetail>(`/sessions/${sessionId}`, {
        body: JSON.stringify({ playerOrder }),
        headers: { "Content-Type": "application/merge-patch+json" },
        method: "PATCH",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
    },
  });
}
