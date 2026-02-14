import { render, screen } from "@testing-library/react";
import Toast from "../../../components/ui/Toast";
import type { ToastItem } from "../../../hooks/useToast";

describe("Toast", () => {
  it("renders a success toast with message", () => {
    const toast: ToastItem = { id: "1", message: "Joueur créé", type: "success" };
    render(<Toast toast={toast} onDismiss={() => {}} />);

    expect(screen.getByText("Joueur créé")).toBeInTheDocument();
  });

  it("renders an error toast with message", () => {
    const toast: ToastItem = { id: "2", message: "Erreur réseau", type: "error" };
    render(<Toast toast={toast} onDismiss={() => {}} />);

    expect(screen.getByText("Erreur réseau")).toBeInTheDocument();
  });

  it("applies success styling", () => {
    const toast: ToastItem = { id: "1", message: "OK", type: "success" };
    const { container } = render(<Toast toast={toast} onDismiss={() => {}} />);

    const toastEl = container.firstChild as HTMLElement;
    expect(toastEl.className).toContain("text-emerald");
  });

  it("applies error styling", () => {
    const toast: ToastItem = { id: "2", message: "KO", type: "error" };
    const { container } = render(<Toast toast={toast} onDismiss={() => {}} />);

    const toastEl = container.firstChild as HTMLElement;
    expect(toastEl.className).toContain("text-red");
  });
});
