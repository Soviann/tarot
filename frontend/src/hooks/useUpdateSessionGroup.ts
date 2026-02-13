import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../services/api";
import type { SessionDetail } from "../types/api";

export function useUpdateSessionGroup(sessionId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId: number | null) =>
      apiFetch<SessionDetail>(`/sessions/${sessionId}`, {
        body: JSON.stringify({
          playerGroup:
            groupId !== null ? `/api/player-groups/${groupId}` : null,
        }),
        headers: { "Content-Type": "application/merge-patch+json" },
        method: "PATCH",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
      queryClient.invalidateQueries({ queryKey: ["player-groups"] });
    },
  });
}
