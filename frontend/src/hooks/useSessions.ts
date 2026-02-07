import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../services/api";
import type { HydraCollection, Session } from "../types/api";

export function useSessions() {
  const query = useQuery({
    queryFn: () => apiFetch<HydraCollection<Session>>("/sessions"),
    queryKey: ["sessions"],
    select: (data) => data.member,
  });

  return {
    ...query,
    sessions: query.data ?? [],
  };
}
