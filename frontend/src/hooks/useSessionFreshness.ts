import { useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../services/api";

interface FreshnessResponse {
  updatedAt: string;
}

export function useSessionFreshness(sessionId: number, enabled: boolean) {
  const queryClient = useQueryClient();
  const lastUpdatedAt = useRef<string | null>(null);

  const query = useQuery({
    enabled,
    queryFn: () => apiFetch<FreshnessResponse>(`/api/sessions/${sessionId}/freshness`),
    queryKey: ["session", sessionId, "freshness"],
    refetchInterval: 5000,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    if (!query.data) return;

    const current = query.data.updatedAt;
    if (lastUpdatedAt.current !== null && lastUpdatedAt.current !== current) {
      queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
    }
    lastUpdatedAt.current = current;
  }, [query.data, queryClient, sessionId]);

  return query;
}
