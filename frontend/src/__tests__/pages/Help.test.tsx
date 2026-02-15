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
      "Badges",
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

  it("displays all badges with emoji, name and condition when expanded", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Help />);

    const badgesButton = screen.getByRole("button", { name: /Badges/ });
    await user.click(badgesButton);

    const expectedBadges = [
      { emoji: "🎮", label: "Première donne", description: "Jouer sa première donne" },
      { emoji: "💯", label: "Centurion", description: "Jouer 100 donnes" },
      { emoji: "🔟", label: "Habitué", description: "Jouer 10 sessions" },
      { emoji: "🔥", label: "Inarrêtable", description: "5 victoires consécutives comme preneur" },
      { emoji: "👑", label: "Premier Chelem", description: "Réussir un Chelem annoncé" },
      { emoji: "⚔️", label: "Kamikaze", description: "Tenter une Garde Contre" },
      { emoji: "🎯", label: "Sans filet", description: "Réussir une Garde Sans" },
      { emoji: "🃏", label: "Petit malin", description: "Réussir 5 Petits au bout" },
      { emoji: "🛡️", label: "Muraille", description: "10 victoires en défense d'affilée" },
      { emoji: "📈", label: "Comeback", description: "Remonter de dernier à premier en une session" },
      { emoji: "💀", label: "Lanterne rouge", description: "Finir dernier 5 fois" },
      { emoji: "⭐", label: "Collectionneur d'étoiles", description: "Recevoir 10 étoiles" },
      { emoji: "⏰", label: "Marathon", description: "Jouer une session de plus de 3 heures" },
      { emoji: "🌙", label: "Noctambule", description: "Jouer une donne après minuit" },
      { emoji: "👥", label: "Sociable", description: "Jouer avec 10 joueurs différents" },
    ];

    for (const badge of expectedBadges) {
      expect(screen.getByText(badge.emoji)).toBeInTheDocument();
      expect(screen.getByText(badge.label)).toBeInTheDocument();
      expect(screen.getByText(badge.description)).toBeInTheDocument();
    }
  });

  it("groups badges by category", async () => {
    const user = userEvent.setup();
    renderWithProviders(<Help />);

    const badgesButton = screen.getByRole("button", { name: /Badges/ });
    await user.click(badgesButton);

    expect(screen.getByText("Progression")).toBeInTheDocument();
    expect(screen.getByText("Performance")).toBeInTheDocument();
    expect(screen.getByText("Fun")).toBeInTheDocument();
    expect(screen.getByText("Social")).toBeInTheDocument();
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
