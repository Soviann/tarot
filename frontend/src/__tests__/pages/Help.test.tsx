import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Help from "../../pages/Help";
import { renderWithProviders } from "../test-utils";

describe("Help", () => {
  it("renders the page title", () => {
    renderWithProviders(<Help />);

    expect(
      screen.getByRole("heading", { level: 1, name: /aide/i }),
    ).toBeInTheDocument();
  });

  it("always shows the Installation section", () => {
    renderWithProviders(<Help />);

    expect(screen.getByText(/Progressive Web App/)).toBeInTheDocument();
  });

  it("renders all accordion section headings", () => {
    renderWithProviders(<Help />);

    const sectionNames = [
      "Concepts clés",
      "Gestion des joueurs",
      "Démarrer une session",
      "Écran de session",
      "Saisir une donne",
      "Consulter les statistiques",
      "Système d'étoiles",
      "Classement ELO",
      "Utilisation sur Smart TV",
      "Thème sombre",
      "Règles de calcul des scores",
    ];

    for (const name of sectionNames) {
      expect(
        screen.getByRole("button", { name: new RegExp(name) }),
      ).toBeInTheDocument();
    }
  });

  it("accordion sections are collapsed by default", () => {
    renderWithProviders(<Help />);

    const conceptsButton = screen.getByRole("button", {
      name: /Concepts clés/,
    });
    expect(conceptsButton).toHaveAttribute("aria-expanded", "false");
  });

  it("expands an accordion section on click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Help />);

    const conceptsButton = screen.getByRole("button", {
      name: /Concepts clés/,
    });
    await user.click(conceptsButton);

    expect(conceptsButton).toHaveAttribute("aria-expanded", "true");
    const panel = document.getElementById(
      conceptsButton.getAttribute("aria-controls")!,
    );
    expect(panel).not.toHaveAttribute("hidden");
  });

  it("collapses an expanded section on second click", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Help />);

    const conceptsButton = screen.getByRole("button", {
      name: /Concepts clés/,
    });
    await user.click(conceptsButton);
    expect(conceptsButton).toHaveAttribute("aria-expanded", "true");

    await user.click(conceptsButton);
    expect(conceptsButton).toHaveAttribute("aria-expanded", "false");
  });

  it("renders a link to the GitHub repository", () => {
    renderWithProviders(<Help />);

    const link = screen.getByRole("link", { name: /github/i });
    expect(link).toHaveAttribute(
      "href",
      "https://github.com/Soviann/tarot",
    );
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("renders a back link to home", () => {
    renderWithProviders(<Help />);

    const backLink = screen.getByRole("link", { name: /retour/i });
    expect(backLink).toHaveAttribute("href", "/");
  });
});
