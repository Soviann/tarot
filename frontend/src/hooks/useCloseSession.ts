import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../services/api";
import type { SessionDetail } from "../types/api";

export function useCloseSession(sessionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (isActive: boolean) =>
      apiFetch<SessionDetail>(`/sessions/${sessionId}`, {
        body: JSON.stringify({ isActive }),
        headers: { "Content-Type": "application/merge-patch+json" },
        method: "PATCH",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}
