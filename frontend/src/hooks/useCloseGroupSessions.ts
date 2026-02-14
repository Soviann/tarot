import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../services/api";

export function useCloseGroupSessions() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (groupId: number) =>
      apiFetch<{ closedCount: number }>(
        `/player-groups/${groupId}/close-sessions`,
        {
          method: "POST",
        },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}
