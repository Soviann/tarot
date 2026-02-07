import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../services/api";
import type { SessionDetail } from "../types/api";

export function useSession(id: number) {
  const query = useQuery({
    queryFn: () => apiFetch<SessionDetail>(`/sessions/${id}`),
    queryKey: ["session", id],
  });

  return {
    ...query,
    session: query.data ?? null,
  };
}
