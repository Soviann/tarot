import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useCheatCode } from "../../hooks/useCheatCode";

function simulateInput(value: string, hasAttribute = true) {
  const input = document.createElement("input");
  if (hasAttribute) input.setAttribute("data-cheat-target", "");
  document.body.appendChild(input);
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  document.body.removeChild(input);
}

describe("useCheatCode", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("active quand la valeur correspond à un trigger name", () => {
    const onActivate = vi.fn();
    renderHook(() => useCheatCode(["doomguy"], onActivate));

    simulateInput("Doomguy");

    expect(onActivate).toHaveBeenCalledOnce();
  });

  it("est insensible à la casse", () => {
    const onActivate = vi.fn();
    renderHook(() => useCheatCode(["doomguy"], onActivate));

    simulateInput("DOOMGUY");

    expect(onActivate).toHaveBeenCalledOnce();
  });

  it("ignore les espaces autour de la valeur", () => {
    const onActivate = vi.fn();
    renderHook(() => useCheatCode(["doomguy"], onActivate));

    simulateInput("  Doomguy  ");

    expect(onActivate).toHaveBeenCalledOnce();
  });

  it("matche n'importe quel trigger name de la liste", () => {
    const onActivate = vi.fn();
    renderHook(() => useCheatCode(["doomguy", "doom guy"], onActivate));

    simulateInput("Doom Guy");

    expect(onActivate).toHaveBeenCalledOnce();
  });

  it("ne se déclenche pas sur un match partiel", () => {
    const onActivate = vi.fn();
    renderHook(() => useCheatCode(["doomguy"], onActivate));

    simulateInput("doom");

    expect(onActivate).not.toHaveBeenCalled();
  });

  it("ignore les inputs sans data-cheat-target", () => {
    const onActivate = vi.fn();
    renderHook(() => useCheatCode(["doomguy"], onActivate));

    simulateInput("Doomguy", false);

    expect(onActivate).not.toHaveBeenCalled();
  });

  it("nettoie le listener au démontage", () => {
    const onActivate = vi.fn();
    const { unmount } = renderHook(() => useCheatCode(["doomguy"], onActivate));

    unmount();

    simulateInput("Doomguy");

    expect(onActivate).not.toHaveBeenCalled();
  });
});
