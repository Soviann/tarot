import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import InProgressBanner from "../../components/InProgressBanner";
import { renderWithProviders } from "../test-utils";
import type { Game } from "../../types/api";

const mockGame: Game = {
  chelem: "none",
  contract: "garde",
  createdAt: "2025-02-01T14:00:00+00:00",
  id: 1,
  oudlers: null,
  partner: null,
  petitAuBout: "none",
  poignee: "none",
  poigneeOwner: "none",
  points: null,
  position: 1,
  scoreEntries: [],
  status: "in_progress",
  taker: { id: 3, name: "Charlie" },
};

describe("InProgressBanner", () => {
  it("renders taker name and avatar", () => {
    renderWithProviders(
      <InProgressBanner game={mockGame} onComplete={() => {}} />,
    );

    expect(screen.getByText("Charlie")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Charlie" })).toBeInTheDocument();
  });

  it("renders contract badge", () => {
    renderWithProviders(
      <InProgressBanner game={mockGame} onComplete={() => {}} />,
    );

    expect(screen.getByText("Garde")).toBeInTheDocument();
  });

  it("renders Compléter button", () => {
    renderWithProviders(
      <InProgressBanner game={mockGame} onComplete={() => {}} />,
    );

    expect(
      screen.getByRole("button", { name: "Compléter" }),
    ).toBeInTheDocument();
  });

  it("calls onComplete when button is clicked", async () => {
    const onComplete = vi.fn();
    renderWithProviders(
      <InProgressBanner game={mockGame} onComplete={onComplete} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Compléter" }));

    expect(onComplete).toHaveBeenCalledOnce();
  });

  it("does not show Annuler button when onCancel is not provided", () => {
    renderWithProviders(
      <InProgressBanner game={mockGame} onComplete={() => {}} />,
    );

    expect(
      screen.queryByRole("button", { name: "Annuler" }),
    ).not.toBeInTheDocument();
  });

  it("shows Annuler button when onCancel is provided", () => {
    renderWithProviders(
      <InProgressBanner game={mockGame} onCancel={() => {}} onComplete={() => {}} />,
    );

    expect(
      screen.getByRole("button", { name: "Annuler" }),
    ).toBeInTheDocument();
  });

  it("calls onCancel when Annuler button is clicked", async () => {
    const onCancel = vi.fn();
    renderWithProviders(
      <InProgressBanner game={mockGame} onCancel={onCancel} onComplete={() => {}} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Annuler" }));

    expect(onCancel).toHaveBeenCalledOnce();
  });
});
