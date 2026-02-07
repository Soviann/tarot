import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../services/api";
import type { Game } from "../types/api";
import type { Chelem, GameStatus, Poignee, Side } from "../types/enums";

export interface CompleteGameInput {
  chelem: Chelem;
  oudlers: number;
  partnerId: number | null;
  petitAuBout: Side;
  poignee: Poignee;
  poigneeOwner: Side;
  points: number;
  status: GameStatus;
}

export function useCompleteGame(gameId: number, sessionId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ partnerId, ...rest }: CompleteGameInput) =>
      apiFetch<Game>(`/games/${gameId}`, {
        body: JSON.stringify({
          chelem: rest.chelem,
          oudlers: rest.oudlers,
          partner: partnerId !== null ? `/api/players/${partnerId}` : null,
          petitAuBout: rest.petitAuBout,
          poignee: rest.poignee,
          poigneeOwner: rest.poigneeOwner,
          points: rest.points,
          status: rest.status,
        }),
        headers: { "Content-Type": "application/merge-patch+json" },
        method: "PATCH",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
    },
  });
}
