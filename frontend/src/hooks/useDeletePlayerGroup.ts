import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../services/api";

export function useDeletePlayerGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<void>(`/player-groups/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["player-groups"] });
      queryClient.invalidateQueries({ queryKey: ["players"] });
    },
  });
}
