import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Spinner from "../../../components/ui/Spinner";

describe("Spinner", () => {
  it("renders with role=status and accessible text", () => {
    render(<Spinner />);
    const status = screen.getByRole("status");
    expect(status).toBeInTheDocument();
    expect(status).toHaveTextContent("Chargement");
  });

  it("renders md size by default", () => {
    const { container } = render(<Spinner />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "32");
    expect(svg).toHaveAttribute("height", "32");
  });

  it("renders sm size when specified", () => {
    const { container } = render(<Spinner size="sm" />);
    const svg = container.querySelector("svg");
    expect(svg).toHaveAttribute("width", "20");
    expect(svg).toHaveAttribute("height", "20");
  });

  it("uses py-8 padding by default (md)", () => {
    render(<Spinner />);
    const wrapper = screen.getByRole("status");
    expect(wrapper.className).toContain("py-8");
  });

  it("uses py-4 padding for sm size", () => {
    render(<Spinner size="sm" />);
    const wrapper = screen.getByRole("status");
    expect(wrapper.className).toContain("py-4");
  });
});
