import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../services/api";
import type { Session } from "../types/api";

export function useCreateSession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (playerIds: number[]) =>
      apiFetch<Session>("/sessions", {
        body: JSON.stringify({
          players: playerIds.map((id) => `/api/players/${id}`),
        }),
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}
