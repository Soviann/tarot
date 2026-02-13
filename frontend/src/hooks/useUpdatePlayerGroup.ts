import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../services/api";
import type { PlayerGroup } from "../types/api";

export function useUpdatePlayerGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: number;
      name?: string;
      players?: string[];
    }) =>
      apiFetch<PlayerGroup>(`/player-groups/${id}`, {
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/merge-patch+json" },
        method: "PATCH",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["player-groups"] });
      queryClient.invalidateQueries({ queryKey: ["players"] });
    },
  });
}
