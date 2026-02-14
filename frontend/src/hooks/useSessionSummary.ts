import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../services/api";
import type { SessionSummary } from "../types/api";

export function useSessionSummary(sessionId: number) {
  return useQuery({
    queryFn: () => apiFetch<SessionSummary>(`/sessions/${sessionId}/summary`),
    queryKey: ["session", sessionId, "summary"],
  });
}
