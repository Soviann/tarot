import { screen } from "@testing-library/react";
import NotFound from "../../pages/NotFound";
import { renderWithProviders } from "../test-utils";

describe("NotFound", () => {
  it("renders a 404 heading", () => {
    renderWithProviders(<NotFound />);

    expect(
      screen.getByRole("heading", { level: 1, name: /404/i }),
    ).toBeInTheDocument();
  });

  it("renders a descriptive message", () => {
    renderWithProviders(<NotFound />);

    expect(screen.getByText(/page.*introuvable/i)).toBeInTheDocument();
  });

  it("renders the L'Excuse tarot card image", () => {
    renderWithProviders(<NotFound />);

    const img = screen.getByRole("img", { name: /excuse/i });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute(
      "src",
      "/Gemini_Generated_Image_xiamevxiamevxiam_resized.png",
    );
  });

  it("renders a link back to home", () => {
    renderWithProviders(<NotFound />);

    const link = screen.getByRole("link", { name: /accueil/i });
    expect(link).toHaveAttribute("href", "/");
  });
});
