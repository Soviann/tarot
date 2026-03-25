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

    const wrapper = container.querySelector("div");
    expect(wrapper?.className).toMatch(/bg-surface-secondary/);
  });

  it("uses dynamic viewport height instead of 100vh to prevent mobile scroll shift", () => {
    const { container } = renderWithProviders(<Layout />);

    const wrapper = container.querySelector("div");
    expect(wrapper?.className).toMatch(/min-h-dvh/);
    expect(wrapper?.className).not.toMatch(/min-h-screen/);
  });

  it("does not render a help icon link", () => {
    renderWithProviders(<Layout />);

    expect(screen.queryByRole("link", { name: /aide/i })).not.toBeInTheDocument();
  });
});
