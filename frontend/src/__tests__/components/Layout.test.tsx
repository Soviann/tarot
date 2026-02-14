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

  it("does not render a help icon link", () => {
    renderWithProviders(<Layout />);

    expect(screen.queryByRole("link", { name: /aide/i })).not.toBeInTheDocument();
  });
});
