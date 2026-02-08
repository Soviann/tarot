import { screen } from "@testing-library/react";
import Layout from "../../components/Layout";
import { renderWithProviders } from "../test-utils";

describe("Layout", () => {
  it("renders the bottom navigation", () => {
    renderWithProviders(<Layout />);

    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("renders with theme surface classes", () => {
    const { container } = renderWithProviders(<Layout />);

    const wrapper = container.firstElementChild;
    expect(wrapper?.className).toMatch(/bg-surface-secondary/);
  });

  it("renders a help icon link pointing to /aide", () => {
    renderWithProviders(<Layout />);

    const helpLink = screen.getByRole("link", { name: /aide/i });
    expect(helpLink).toHaveAttribute("href", "/aide");
  });
});
