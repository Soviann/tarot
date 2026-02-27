import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../services/api";
import type { HeadToHeadStats } from "../types/api";

export function useHeadToHead(
  player1Id?: number,
  player2Id?: number,
  playerGroupId?: number | null,
  from?: string | null,
  to?: string | null,
) {
  const enabled =
    player1Id !== undefined &&
    player2Id !== undefined &&
    player1Id !== player2Id;

  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (player1Id !== undefined) params.set("player1", String(player1Id));
  if (player2Id !== undefined) params.set("player2", String(player2Id));
  if (playerGroupId) params.set("playerGroup", String(playerGroupId));
  if (to) params.set("to", to);

  const qs = params.toString();
  const path = `/statistics/head-to-head${qs ? `?${qs}` : ""}`;

  const query = useQuery({
    enabled,
    queryFn: () => apiFetch<HeadToHeadStats>(path),
    queryKey: [
      "statistics",
      "head-to-head",
      {
        from: from ?? null,
        player1Id: player1Id ?? null,
        player2Id: player2Id ?? null,
        playerGroupId: playerGroupId ?? null,
        to: to ?? null,
      },
    ],
  });

  return {
    ...query,
    stats: query.data ?? null,
  };
}
