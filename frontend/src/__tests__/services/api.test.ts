import { ApiError, apiFetch } from "../../services/api";

describe("apiFetch", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("retourne le JSON et envoie les headers par défaut", async () => {
    const data = { id: 1, name: "Alice" };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(data),
    });

    const result = await apiFetch("/players");

    expect(result).toEqual(data);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/players"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: "application/ld+json",
          "Content-Type": "application/ld+json",
        }),
      }),
    );
  });

  it("retourne undefined pour une réponse 204 No Content", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 204,
    });

    const result = await apiFetch("/games/1");

    expect(result).toBeUndefined();
  });

  it("transmet les headers et options custom", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({}),
    });

    await apiFetch("/players", {
      method: "POST",
      headers: { "X-Custom": "value" },
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/players"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "X-Custom": "value",
        }),
      }),
    );
  });

  it("lance ApiError avec hydra:description sur une erreur 422", async () => {
    const body = { "hydra:description": "Nom obligatoire" };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 422,
      json: () => Promise.resolve(body),
    });

    await expect(apiFetch("/players")).rejects.toThrow(ApiError);

    try {
      await apiFetch("/players");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      const apiError = error as ApiError;
      expect(apiError.message).toBe("422: Nom obligatoire");
      expect(apiError.status).toBe(422);
      expect(apiError.body).toEqual(body);
    }
  });

  it("lance ApiError avec detail sur une erreur 500", async () => {
    const body = { detail: "Internal Server Error" };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve(body),
    });

    try {
      await apiFetch("/games");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      const apiError = error as ApiError;
      expect(apiError.message).toBe("500: Internal Server Error");
      expect(apiError.status).toBe(500);
      expect(apiError.body).toEqual(body);
    }
  });

  it("utilise le message fallback quand le JSON de l'erreur est invalide", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 502,
      json: () => Promise.reject(new SyntaxError("Unexpected token")),
    });

    try {
      await apiFetch("/players");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      const apiError = error as ApiError;
      expect(apiError.message).toBe("API error: 502");
      expect(apiError.status).toBe(502);
      expect(apiError.body).toBeNull();
    }
  });

  it("utilise le message fallback quand le body ne contient ni hydra:description ni detail", async () => {
    const body = { title: "Bad Request", type: "/errors/400" };
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve(body),
    });

    try {
      await apiFetch("/games");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      const apiError = error as ApiError;
      expect(apiError.message).toBe("API error: 400");
      expect(apiError.status).toBe(400);
      expect(apiError.body).toEqual(body);
    }
  });

  it("propage directement l'erreur réseau quand fetch rejette", async () => {
    const networkError = new TypeError("Failed to fetch");
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(networkError);

    await expect(apiFetch("/players")).rejects.toThrow(networkError);
    await expect(apiFetch("/players")).rejects.not.toBeInstanceOf(ApiError);
  });
});
