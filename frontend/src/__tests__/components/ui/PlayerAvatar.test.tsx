import { screen } from "@testing-library/react";
import { useTheme } from "next-themes";
import type { Mock } from "vitest";
import PlayerAvatar from "../../../components/ui/PlayerAvatar";
import { renderWithProviders } from "../../test-utils";

vi.mock("next-themes", async () => {
  const actual = await vi.importActual("next-themes");
  return {
    ...actual,
    useTheme: vi.fn().mockReturnValue({
      forcedTheme: undefined,
      resolvedTheme: "light",
      setTheme: vi.fn(),
      systemTheme: undefined,
      theme: "light",
      themes: ["light", "dark", "doom"],
    }),
  };
});

vi.mock("../../../services/themeRegistry", async () => {
  const actual = await vi.importActual("../../../services/themeRegistry");
  return {
    ...actual,
    getThemeConfig: vi.fn((...args: unknown[]) =>
      (actual as Record<string, (...args: unknown[]) => unknown>).getThemeConfig(...args),
    ),
  };
});

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

    const bg1 = c1.querySelector("[role=img]")?.getAttribute("style");
    const bg2 = c2.querySelector("[role=img]")?.getAttribute("style");
    expect(bg1).toBe(bg2);
  });

  it("uses name hash for color when playerId is absent", () => {
    const { container: c1 } = renderWithProviders(
      <PlayerAvatar name="Alice" />,
    );
    const { container: c2 } = renderWithProviders(
      <PlayerAvatar name="Alice" />,
    );

    const bg1 = c1.querySelector("[role=img]")?.getAttribute("style");
    const bg2 = c2.querySelector("[role=img]")?.getAttribute("style");
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
  });

  it("falls back to palette color when color is null", () => {
    renderWithProviders(
      <PlayerAvatar color={null} name="Alice" playerId={3} />,
    );

    const avatar = screen.getByRole("img", { name: "Alice" });
    expect(avatar.style.backgroundColor).toBeTruthy();
  });

  describe("themed rendering (doom)", () => {
    const mockUseTheme = useTheme as Mock;

    beforeEach(() => {
      mockUseTheme.mockReturnValue({
        forcedTheme: undefined,
        resolvedTheme: "doom",
        setTheme: vi.fn(),
        systemTheme: undefined,
        theme: "doom",
        themes: ["light", "dark", "doom"],
      });
    });

    afterEach(() => {
      mockUseTheme.mockReturnValue({
        forcedTheme: undefined,
        resolvedTheme: "light",
        setTheme: vi.fn(),
        systemTheme: undefined,
        theme: "light",
        themes: ["light", "dark", "doom"],
      });
    });

    it("renders themed avatar with img tag when theme has config", () => {
      renderWithProviders(<PlayerAvatar name="Alice" playerId={0} />);

      const avatar = screen.getByRole("img", { name: "Alice" });
      expect(avatar).toBeInTheDocument();
      const img = avatar.querySelector("img");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute(
        "src",
        "/images/doom/doom-bleeding-256x256.png",
      );
    });

    it("uses name hash for icon index when playerId is absent in themed mode", () => {
      renderWithProviders(<PlayerAvatar name="Alice" />);

      const avatar = screen.getByRole("img", { name: "Alice" });
      const img = avatar.querySelector("img");
      expect(img).toBeInTheDocument();
      expect(img).toHaveAttribute("src", expect.stringContaining("/images/doom/"));
    });

    it("shows initials below when theme has initialsPosition below", async () => {
      const { getThemeConfig } = await import("../../../services/themeRegistry") as { getThemeConfig: Mock };
      getThemeConfig.mockReturnValue({
        avatars: {
          icons: ["/images/test/icon.png"],
          initialsPosition: "below",
        },
      });

      renderWithProviders(<PlayerAvatar name="Alice" playerId={0} />);

      const avatar = screen.getByRole("img", { name: "Alice" });
      const initialsSpan = avatar.querySelector("span.text-\\[0\\.6rem\\]");
      expect(initialsSpan).toBeInTheDocument();
      expect(initialsSpan).toHaveTextContent("AL");
    });
  });
});
