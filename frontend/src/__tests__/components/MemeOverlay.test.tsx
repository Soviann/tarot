import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MemeOverlay from "../../components/MemeOverlay";
import type { MemeConfig } from "../../services/memeSelector";

const meme: MemeConfig = {
  caption: "It's over 9000 !",
  id: "over-9000",
  image: "/memes/over-9000.webp",
};

describe("MemeOverlay", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing when meme is null", () => {
    const { container } = render(
      <MemeOverlay meme={null} onDismiss={vi.fn()} />,
    );

    expect(container.innerHTML).toBe("");
  });

  it("renders image and caption when meme is provided", () => {
    render(<MemeOverlay meme={meme} onDismiss={vi.fn()} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("img")).toHaveAttribute("src", "/memes/over-9000.webp");
    expect(screen.getByText("It's over 9000 !")).toBeInTheDocument();
  });

  it("calls onDismiss after 3 seconds", () => {
    const onDismiss = vi.fn();
    render(<MemeOverlay meme={meme} onDismiss={onDismiss} />);

    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("calls onDismiss on click", async () => {
    vi.useRealTimers(); // userEvent needs real timers
    const onDismiss = vi.fn();
    render(<MemeOverlay meme={meme} onDismiss={onDismiss} />);

    await userEvent.click(screen.getByRole("dialog"));

    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it("uses provided aria-label", () => {
    render(<MemeOverlay ariaLabel="Mème de défaite" meme={meme} onDismiss={vi.fn()} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-label", "Mème de défaite");
  });

  it("defaults aria-label to Mème", () => {
    render(<MemeOverlay meme={meme} onDismiss={vi.fn()} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-label", "Mème");
  });

  it("does not render caption when it is empty", () => {
    const noCaption: MemeConfig = { caption: "", id: "test", image: "/memes/test.webp" };
    render(<MemeOverlay meme={noCaption} onDismiss={vi.fn()} />);

    expect(screen.getByRole("img")).toBeInTheDocument();
    expect(screen.queryByText("", { selector: "p" })).not.toBeInTheDocument();
  });

  it("cleans up timer on unmount", () => {
    const onDismiss = vi.fn();
    const { unmount } = render(
      <MemeOverlay meme={meme} onDismiss={onDismiss} />,
    );

    unmount();

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onDismiss).not.toHaveBeenCalled();
  });
});
