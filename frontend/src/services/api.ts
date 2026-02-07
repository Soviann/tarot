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
    throw new ApiError(body, `API error: ${response.status}`, response.status);
  }

  return response.json();
}
