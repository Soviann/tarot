import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../services/api";
import type { PlayerGroup } from "../types/api";

export function useCreatePlayerGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; players: string[] }) =>
      apiFetch<PlayerGroup>("/player-groups", {
        body: JSON.stringify(data),
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["player-groups"] });
      queryClient.invalidateQueries({ queryKey: ["players"] });
    },
  });
}
