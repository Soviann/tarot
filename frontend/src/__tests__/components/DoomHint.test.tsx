import { render, screen } from "@testing-library/react";
import { act } from "react";
import DoomHint from "../../components/DoomHint";
import { useHintCooldown } from "../../hooks/useHintCooldown";
import * as doomWeek from "../../services/doomWeek";

vi.mock("../../hooks/useHintCooldown");
vi.mock("../../services/doomWeek");

const mockCanShowHint = vi.fn(() => true);
const mockMarkHintShown = vi.fn();

describe("DoomHint", () => {
  beforeEach(() => {
    mockCanShowHint.mockReturnValue(true);
    mockMarkHintShown.mockClear();
    vi.mocked(useHintCooldown).mockReturnValue({
      canShowHint: mockCanShowHint,
      markHintShown: mockMarkHintShown,
    });
    vi.mocked(doomWeek.getHintChance).mockReturnValue(0.02);
    vi.useFakeTimers();
    vi.spyOn(Math, "random");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("shows doom icon on document click when random < 0.02 and cooldown allows", () => {
    vi.mocked(Math.random)
      .mockReturnValueOnce(0.01)  // chance check
      .mockReturnValueOnce(0)     // icon index
      .mockReturnValueOnce(0)     // direction
      .mockReturnValueOnce(0.5);  // perpendicular position
    render(<DoomHint />);

    act(() => {
      document.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(screen.getByTestId("doom-hint-icon")).toBeInTheDocument();
    expect(mockMarkHintShown).toHaveBeenCalledOnce();
  });

  it("does not show icon when random >= 0.02", () => {
    vi.mocked(Math.random).mockReturnValue(0.03);
    render(<DoomHint />);

    act(() => {
      document.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(screen.queryByTestId("doom-hint-icon")).not.toBeInTheDocument();
    expect(mockMarkHintShown).not.toHaveBeenCalled();
  });

  it("does not show icon when cooldown is active", () => {
    mockCanShowHint.mockReturnValue(false);
    vi.mocked(Math.random).mockReturnValue(0.01);
    render(<DoomHint />);

    act(() => {
      document.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(screen.queryByTestId("doom-hint-icon")).not.toBeInTheDocument();
  });

  it("removes icon after animation (2s)", () => {
    vi.mocked(Math.random)
      .mockReturnValueOnce(0.01)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.5);
    render(<DoomHint />);

    act(() => {
      document.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(screen.getByTestId("doom-hint-icon")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(2100));

    expect(screen.queryByTestId("doom-hint-icon")).not.toBeInTheDocument();
  });

  it("uses a doom icon image", () => {
    vi.mocked(Math.random)
      .mockReturnValueOnce(0.01)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.5);
    render(<DoomHint />);

    act(() => {
      document.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const img = screen.getByTestId("doom-hint-icon");
    expect(img.tagName).toBe("IMG");
    expect(img.getAttribute("src")).toMatch(/doom.*32x32/);
  });

  it("cleans up event listener on unmount", () => {
    const spy = vi.spyOn(document, "removeEventListener");
    const { unmount } = render(<DoomHint />);

    unmount();

    expect(spy).toHaveBeenCalledWith("click", expect.any(Function));
  });

  it("uses boosted chance during doom week (shows icon at random 0.05)", () => {
    vi.mocked(doomWeek.getHintChance).mockReturnValue(0.1);
    vi.mocked(Math.random)
      .mockReturnValueOnce(0.05)  // chance check: 0.05 < 0.1 → passes
      .mockReturnValueOnce(0)     // icon index
      .mockReturnValueOnce(0)     // direction
      .mockReturnValueOnce(0.5);  // perpendicular position
    render(<DoomHint />);

    act(() => {
      document.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(screen.getByTestId("doom-hint-icon")).toBeInTheDocument();
  });

  it("does not show icon at random 0.05 outside doom week", () => {
    vi.mocked(doomWeek.getHintChance).mockReturnValue(0.02);
    vi.mocked(Math.random).mockReturnValue(0.05);  // 0.05 >= 0.02 → fails
    render(<DoomHint />);

    act(() => {
      document.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(screen.queryByTestId("doom-hint-icon")).not.toBeInTheDocument();
  });
});
