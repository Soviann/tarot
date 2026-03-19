import { fireEvent, render, screen } from "@testing-library/react";
import { act } from "react";
import KonamiHint from "../../components/KonamiHint";
import { useHintCooldown } from "../../hooks/useHintCooldown";

vi.mock("../../hooks/useHintCooldown");

const mockCanShowHint = vi.fn(() => true);
const mockMarkHintShown = vi.fn();

describe("KonamiHint", () => {
  beforeEach(() => {
    mockCanShowHint.mockReturnValue(true);
    mockMarkHintShown.mockClear();
    vi.mocked(useHintCooldown).mockReturnValue({
      canShowHint: mockCanShowHint,
      markHintShown: mockMarkHintShown,
    });
    vi.useFakeTimers();
    vi.spyOn(Math, "random");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("shows konami logo on click when random < 0.05 and cooldown allows", () => {
    vi.mocked(Math.random).mockReturnValue(0.01);
    render(<KonamiHint />);

    fireEvent.click(screen.getByTestId("konami-hint-trigger"));

    expect(screen.getByAltText("Konami")).toBeInTheDocument();
    expect(mockMarkHintShown).toHaveBeenCalledOnce();
  });

  it("does not show logo when random >= 0.05", () => {
    vi.mocked(Math.random).mockReturnValue(0.06);
    render(<KonamiHint />);

    fireEvent.click(screen.getByTestId("konami-hint-trigger"));

    expect(screen.queryByAltText("Konami")).not.toBeInTheDocument();
    expect(mockMarkHintShown).not.toHaveBeenCalled();
  });

  it("does not show logo when cooldown is active", () => {
    mockCanShowHint.mockReturnValue(false);
    vi.mocked(Math.random).mockReturnValue(0.01);
    render(<KonamiHint />);

    fireEvent.click(screen.getByTestId("konami-hint-trigger"));

    expect(screen.queryByAltText("Konami")).not.toBeInTheDocument();
  });

  it("hides logo after 2 seconds", () => {
    vi.mocked(Math.random).mockReturnValue(0.01);
    render(<KonamiHint />);

    fireEvent.click(screen.getByTestId("konami-hint-trigger"));
    expect(screen.getByAltText("Konami")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(2100));

    expect(screen.queryByAltText("Konami")).not.toBeInTheDocument();
  });

  it("renders children inside the trigger", () => {
    render(
      <KonamiHint>
        <span>child content</span>
      </KonamiHint>,
    );

    expect(screen.getByText("child content")).toBeInTheDocument();
  });
});
