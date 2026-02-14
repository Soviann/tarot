import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import PersonalRecords from "../../components/PersonalRecords";
import type { PersonalRecord } from "../../types/api";

afterEach(() => {
  vi.clearAllMocks();
});

const mockRecords: PersonalRecord[] = [
  { contract: "petite", date: "2026-01-15T14:00:00+00:00", sessionId: 5, type: "best_score", value: 312 },
  { contract: "garde", date: "2026-01-10T10:00:00+00:00", sessionId: 3, type: "worst_score", value: -180 },
  { contract: null, date: "2026-01-20T18:00:00+00:00", sessionId: null, type: "win_streak", value: 7 },
  { contract: null, date: "2026-01-12T09:00:00+00:00", sessionId: 5, type: "best_session", value: 540 },
  { contract: "garde_sans", date: "2026-01-18T16:00:00+00:00", sessionId: 2, type: "biggest_diff", value: 25.5 },
];

function renderComponent(records: PersonalRecord[] = mockRecords) {
  return render(
    <MemoryRouter>
      <PersonalRecords records={records} />
    </MemoryRouter>,
  );
}

describe("PersonalRecords", () => {
  it("renders section title and all records", () => {
    renderComponent();
    expect(screen.getByText("Records personnels")).toBeInTheDocument();
    expect(screen.getByText("Meilleur score")).toBeInTheDocument();
    expect(screen.getByText("Pire score")).toBeInTheDocument();
    expect(screen.getByText("Série de victoires")).toBeInTheDocument();
    expect(screen.getByText("Meilleure session")).toBeInTheDocument();
    expect(screen.getByText("Plus grand écart")).toBeInTheDocument();
  });

  it("formats record values correctly", () => {
    renderComponent();
    expect(screen.getByText("312")).toBeInTheDocument();
    expect(screen.getByText("\u2212180")).toBeInTheDocument();
    expect(screen.getByText("7 donnes")).toBeInTheDocument();
    expect(screen.getByText("540")).toBeInTheDocument();
    expect(screen.getByText("25.5 pts")).toBeInTheDocument();
  });

  it("renders nothing when records are empty", () => {
    const { container } = renderComponent([]);
    expect(container.firstChild).toBeNull();
  });

  it("shows session links for records with sessionId", () => {
    renderComponent();
    const links = screen.getAllByText("Voir");
    // Records with sessionId: best_score(5), worst_score(3), best_session(5), biggest_diff(2)
    expect(links).toHaveLength(4);
  });

  it("displays contract badges when contract is present", () => {
    renderComponent();
    expect(screen.getByText("Petite")).toBeInTheDocument();
    expect(screen.getByText("Garde")).toBeInTheDocument();
    expect(screen.getByText("Garde Sans")).toBeInTheDocument();
  });

  it("handles single win streak correctly", () => {
    renderComponent([
      { contract: null, date: "2026-01-20T18:00:00+00:00", sessionId: null, type: "win_streak", value: 1 },
    ]);
    expect(screen.getByText("1 donne")).toBeInTheDocument();
  });
});
