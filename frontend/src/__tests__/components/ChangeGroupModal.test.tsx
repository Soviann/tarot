import { fireEvent, screen } from "@testing-library/react";
import ChangeGroupModal from "../../components/ChangeGroupModal";
import { renderWithProviders } from "../test-utils";

const groups = [
  { id: 1, name: "Groupe A", players: [] },
  { id: 2, name: "Groupe B", players: [] },
];

describe("ChangeGroupModal", () => {
  it("renders title and groups", () => {
    renderWithProviders(
      <ChangeGroupModal
        currentGroupId={null}
        groups={groups}
        isPending={false}
        onClose={() => {}}
        onConfirm={() => {}}
        open={true}
      />,
    );

    expect(screen.getByText("Changer le groupe")).toBeInTheDocument();
    expect(screen.getByText("Groupe A")).toBeInTheDocument();
    expect(screen.getByText("Groupe B")).toBeInTheDocument();
    expect(screen.getByText("Aucun groupe")).toBeInTheDocument();
  });

  it("highlights the current group", () => {
    renderWithProviders(
      <ChangeGroupModal
        currentGroupId={1}
        groups={groups}
        isPending={false}
        onClose={() => {}}
        onConfirm={() => {}}
        open={true}
      />,
    );

    const groupAButton = screen.getByRole("button", { name: "Groupe A" });
    expect(groupAButton.className).toContain("ring");
  });

  it("calls onConfirm with the selected group id", () => {
    const onConfirm = vi.fn();
    renderWithProviders(
      <ChangeGroupModal
        currentGroupId={null}
        groups={groups}
        isPending={false}
        onClose={() => {}}
        onConfirm={onConfirm}
        open={true}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Groupe B" }));
    expect(onConfirm).toHaveBeenCalledWith(2);
  });

  it("calls onConfirm with null when selecting Aucun groupe", () => {
    const onConfirm = vi.fn();
    renderWithProviders(
      <ChangeGroupModal
        currentGroupId={1}
        groups={groups}
        isPending={false}
        onClose={() => {}}
        onConfirm={onConfirm}
        open={true}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Aucun groupe" }));
    expect(onConfirm).toHaveBeenCalledWith(null);
  });

  it("disables buttons when isPending", () => {
    renderWithProviders(
      <ChangeGroupModal
        currentGroupId={null}
        groups={groups}
        isPending={true}
        onClose={() => {}}
        onConfirm={() => {}}
        open={true}
      />,
    );

    expect(screen.getByRole("button", { name: "Groupe A" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Aucun groupe" })).toBeDisabled();
  });
});
