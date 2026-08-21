import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import BadgeEmoji from "../../components/BadgeEmoji";

let mockResolvedTheme = "light";

vi.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme: mockResolvedTheme,
  }),
}));

describe("BadgeEmoji", () => {
  it("renders standard emoji when theme is not noel", () => {
    mockResolvedTheme = "light";
    render(<BadgeEmoji emoji="🎲" type="audacious" />);

    expect(screen.getByText("🎲")).toBeInTheDocument();
  });

  it("renders custom image icon for catch_them_all when theme is not noel", () => {
    mockResolvedTheme = "light";
    render(<BadgeEmoji emoji="⚾" type="catch_them_all" />);

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "/pokeball.png");
  });

  it("renders festive Christmas variant when theme is noel", () => {
    mockResolvedTheme = "noel";
    render(<BadgeEmoji emoji="🎲" type="audacious" />);

    expect(screen.getByText("🎁")).toBeInTheDocument();
  });

  it("renders festive Christmas variant for catch_them_all when theme is noel", () => {
    mockResolvedTheme = "noel";
    render(<BadgeEmoji emoji="⚾" type="catch_them_all" />);

    expect(screen.getByText("🎄")).toBeInTheDocument();
  });
});
