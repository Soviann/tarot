import { screen } from "@testing-library/react";
import ContractBadge from "../../../components/ui/ContractBadge";
import { Contract } from "../../../types/enums";
import { renderWithProviders } from "../../test-utils";

describe("ContractBadge", () => {
  it('renders "Petite" with green color', () => {
    renderWithProviders(<ContractBadge contract={Contract.Petite} />);

    const badge = screen.getByText("Petite");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toMatch(/bg-contract-petite/);
  });

  it('renders "Garde" with blue color', () => {
    renderWithProviders(<ContractBadge contract={Contract.Garde} />);

    const badge = screen.getByText("Garde");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toMatch(/bg-contract-garde(?!-)/);
  });

  it('renders "Garde Sans" with orange color', () => {
    renderWithProviders(<ContractBadge contract={Contract.GardeSans} />);

    const badge = screen.getByText("Garde Sans");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toMatch(/bg-contract-garde-sans/);
  });

  it('renders "Garde Contre" with red color', () => {
    renderWithProviders(<ContractBadge contract={Contract.GardeContre} />);

    const badge = screen.getByText("Garde Contre");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toMatch(/bg-contract-garde-contre/);
  });
});
