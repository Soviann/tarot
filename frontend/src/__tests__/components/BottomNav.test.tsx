import { screen } from "@testing-library/react";
import BottomNav from "../../components/BottomNav";
import { renderWithProviders } from "../test-utils";

describe("BottomNav", () => {
  it("renders four navigation links", () => {
    renderWithProviders(<BottomNav />);

    expect(screen.getByRole("link", { name: /accueil/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /stats/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /groupes/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /joueurs/i })).toBeInTheDocument();
  });

  it("renders SVG icons instead of emojis", () => {
    renderWithProviders(<BottomNav />);

    const nav = screen.getByRole("navigation");
    const svgs = nav.querySelectorAll("svg");
    expect(svgs).toHaveLength(4);
  });

  it("has correct href for each link", () => {
    renderWithProviders(<BottomNav />);

    expect(screen.getByRole("link", { name: /accueil/i })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: /stats/i })).toHaveAttribute("href", "/stats");
    expect(screen.getByRole("link", { name: /groupes/i })).toHaveAttribute("href", "/groups");
    expect(screen.getByRole("link", { name: /joueurs/i })).toHaveAttribute("href", "/players");
  });

  it("highlights the active link with font-semibold and its own colored top border", () => {
    renderWithProviders(<BottomNav />);

    const homeLink = screen.getByRole("link", { name: /accueil/i });
    expect(homeLink.className).toMatch(/font-semibold/);
    expect(homeLink.className).toMatch(/border-blue-500/);
    expect(homeLink.className).toMatch(/text-blue-500/);
  });

  it("uses transparent top border on inactive links", () => {
    renderWithProviders(<BottomNav />);

    const statsLink = screen.getByRole("link", { name: /stats/i });
    expect(statsLink.className).toMatch(/border-transparent/);
    expect(statsLink.className).toMatch(/text-text-secondary/);
  });
});
