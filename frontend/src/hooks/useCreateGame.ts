import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "../services/api";
import type { Game } from "../types/api";
import type { Contract } from "../types/enums";

interface CreateGameInput {
  contract: Contract;
  takerId: number;
}

export function useCreateGame(sessionId: number) {
  return useMutation({
    mutationFn: ({ contract, takerId }: CreateGameInput) =>
      apiFetch<Game>(`/sessions/${sessionId}/games`, {
        body: JSON.stringify({
          contract,
          taker: `/api/players/${takerId}`,
        }),
        method: "POST",
      }),
  });
}
