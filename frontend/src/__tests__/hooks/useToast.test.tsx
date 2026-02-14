import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { createElement } from "react";
import { ToastProvider, useToast } from "../../hooks/useToast";

function createWrapper() {
  return ({ children }: { children: ReactNode }) =>
    createElement(ToastProvider, null, children);
}

describe("useToast", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("throws when used outside ToastProvider", () => {
    expect(() => {
      renderHook(() => useToast());
    }).toThrow("useToast must be used within a ToastProvider");
  });

  it("starts with no toasts", () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: createWrapper(),
    });
    expect(result.current.toasts).toEqual([]);
  });

  it("adds a success toast", () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.toast("Joueur créé");
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      message: "Joueur créé",
      type: "success",
    });
  });

  it("adds an error toast", () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.toastError("Erreur de connexion");
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0]).toMatchObject({
      message: "Erreur de connexion",
      type: "error",
    });
  });

  it("auto-dismisses success toast after 2s", () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.toast("Donne enregistrée");
    });
    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it("auto-dismisses error toast after 3s", () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.toastError("Erreur");
    });
    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it("stacks multiple toasts", () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.toast("Premier");
      result.current.toast("Deuxième");
      result.current.toast("Troisième");
    });

    expect(result.current.toasts).toHaveLength(3);
  });

  it("limits visible toasts to 3 and drops oldest", () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.toast("Un");
      result.current.toast("Deux");
      result.current.toast("Trois");
      result.current.toast("Quatre");
    });

    expect(result.current.toasts).toHaveLength(3);
    expect(result.current.toasts[0].message).toBe("Deux");
    expect(result.current.toasts[2].message).toBe("Quatre");
  });

  it("allows manual dismiss", () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.toast("À fermer");
    });

    const toastId = result.current.toasts[0].id;

    act(() => {
      result.current.dismiss(toastId);
    });

    expect(result.current.toasts).toHaveLength(0);
  });
});
