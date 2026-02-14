import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Layout from "../../components/Layout";
import { renderWithProviders } from "../test-utils";

describe("Layout", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark");
  });

  it("renders the bottom navigation", () => {
    renderWithProviders(<Layout />);

    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("renders with theme surface classes", () => {
    const { container } = renderWithProviders(<Layout />);

    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toMatch(/bg-surface-secondary/);
  });

  it("does not render a help icon link", () => {
    renderWithProviders(<Layout />);

    expect(screen.queryByRole("link", { name: /aide/i })).not.toBeInTheDocument();
  });

  it("renders a theme toggle button", () => {
    renderWithProviders(<Layout />);

    const toggle = screen.getByRole("button", { name: /thème/i });
    expect(toggle).toBeInTheDocument();
  });

  it("toggles dark mode when clicking the theme button", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Layout />);

    const toggle = screen.getByRole("button", { name: /thème/i });
    await user.click(toggle);

    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("toggles back to light mode on second click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Layout />);

    const toggle = screen.getByRole("button", { name: /thème/i });
    await user.click(toggle);
    await user.click(toggle);

    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });
});
