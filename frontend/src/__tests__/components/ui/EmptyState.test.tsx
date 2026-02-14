import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Users } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import EmptyState from "../../../components/ui/EmptyState";

describe("EmptyState", () => {
  it("renders icon and message", () => {
    render(
      <EmptyState
        icon={<Users data-testid="icon" />}
        message="Aucun groupe créé"
      />,
    );
    expect(screen.getByTestId("icon")).toBeInTheDocument();
    expect(screen.getByText("Aucun groupe créé")).toBeInTheDocument();
  });

  it("renders without action button by default", () => {
    render(<EmptyState icon={<Users />} message="Test" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders action button and calls onClick", async () => {
    const onClick = vi.fn();
    render(
      <EmptyState
        action={{ label: "Créer un groupe", onClick }}
        icon={<Users />}
        message="Aucun groupe créé"
      />,
    );
    const button = screen.getByRole("button", { name: "Créer un groupe" });
    expect(button).toBeInTheDocument();
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
