import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../services/api";
import type { GlobalStatistics } from "../types/api";

export function useGlobalStats() {
  const query = useQuery({
    queryFn: () => apiFetch<GlobalStatistics>("/statistics"),
    queryKey: ["statistics"],
  });

  return {
    ...query,
    stats: query.data ?? null,
  };
}
