import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../services/api";
import type { Player } from "../types/api";

interface UpdatePlayerVariables {
  active?: boolean;
  id: number;
  name?: string;
}

export function useUpdatePlayer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: UpdatePlayerVariables) =>
      apiFetch<Player>(`/players/${id}`, {
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/merge-patch+json" },
        method: "PATCH",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
    },
  });
}
