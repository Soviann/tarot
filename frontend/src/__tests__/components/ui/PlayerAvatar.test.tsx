import { screen } from "@testing-library/react";
import PlayerAvatar from "../../../components/ui/PlayerAvatar";
import { renderWithProviders } from "../../test-utils";

describe("PlayerAvatar", () => {
  it("displays the first two letters of the name in uppercase", () => {
    renderWithProviders(<PlayerAvatar name="alice" />);

    expect(screen.getByText("AL")).toBeInTheDocument();
  });

  it("handles single-character names", () => {
    renderWithProviders(<PlayerAvatar name="A" />);

    expect(screen.getByText("A")).toBeInTheDocument();
  });

  it("extracts initials from compound names with space", () => {
    renderWithProviders(<PlayerAvatar name="Alice Martin" />);

    expect(screen.getByText("AM")).toBeInTheDocument();
  });

  it("extracts initials from hyphenated names", () => {
    renderWithProviders(<PlayerAvatar name="Jean-Pierre" />);

    expect(screen.getByText("JP")).toBeInTheDocument();
  });

  it("has role=img with accessible label", () => {
    renderWithProviders(<PlayerAvatar name="Bob" />);

    const avatar = screen.getByRole("img", { name: "Bob" });
    expect(avatar).toBeInTheDocument();
  });

  it("uses playerId for deterministic color when provided", () => {
    const { container: c1 } = renderWithProviders(
      <PlayerAvatar name="Alice" playerId={3} />,
    );
    const { container: c2 } = renderWithProviders(
      <PlayerAvatar name="Different" playerId={3} />,
    );

    const bg1 = c1.querySelector("[role=img]")?.className;
    const bg2 = c2.querySelector("[role=img]")?.className;
    expect(bg1).toBe(bg2);
  });

  it("uses name hash for color when playerId is absent", () => {
    const { container: c1 } = renderWithProviders(
      <PlayerAvatar name="Alice" />,
    );
    const { container: c2 } = renderWithProviders(
      <PlayerAvatar name="Alice" />,
    );

    const bg1 = c1.querySelector("[role=img]")?.className;
    const bg2 = c2.querySelector("[role=img]")?.className;
    expect(bg1).toBe(bg2);
  });

  it("renders sm size (32px)", () => {
    renderWithProviders(<PlayerAvatar name="Al" size="sm" />);

    const avatar = screen.getByRole("img");
    expect(avatar.className).toMatch(/size-8/);
  });

  it("renders md size (40px) by default", () => {
    renderWithProviders(<PlayerAvatar name="Al" />);

    const avatar = screen.getByRole("img");
    expect(avatar.className).toMatch(/size-10/);
  });

  it("renders lg size (56px)", () => {
    renderWithProviders(<PlayerAvatar name="Al" size="lg" />);

    const avatar = screen.getByRole("img");
    expect(avatar.className).toMatch(/size-14/);
  });

  it("uses custom color via inline style when provided", () => {
    renderWithProviders(<PlayerAvatar color="#ef4444" name="Alice" />);

    const avatar = screen.getByRole("img", { name: "Alice" });
    expect(avatar.style.backgroundColor).toBe("rgb(239, 68, 68)");
    // Should NOT have a bg-avatar-* class
    expect(avatar.className).not.toMatch(/bg-avatar-/);
  });

  it("falls back to palette color when color is null", () => {
    renderWithProviders(
      <PlayerAvatar color={null} name="Alice" playerId={3} />,
    );

    const avatar = screen.getByRole("img", { name: "Alice" });
    expect(avatar.className).toMatch(/bg-avatar-/);
    expect(avatar.style.backgroundColor).toBe("");
  });
});
