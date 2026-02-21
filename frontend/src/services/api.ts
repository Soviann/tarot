const API_BASE = import.meta.env.VITE_API_URL ?? "/api";

export class ApiError extends Error {
  body: unknown;
  status: number;

  constructor(body: unknown, message: string, status: number) {
    super(message);
    this.body = body;
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      Accept: "application/ld+json",
      "Content-Type": "application/ld+json",
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const detail =
      (body as Record<string, unknown> | null)?.["hydra:description"] ??
      (body as Record<string, unknown> | null)?.detail;
    const message = typeof detail === "string"
      ? `${response.status}: ${detail}`
      : `API error: ${response.status}`;
    throw new ApiError(body, message, response.status);
  }

  if (response.status === 204) return undefined as T;

  return response.json();
}
