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
});
