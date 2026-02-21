import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import ErrorBoundary from "../../components/ErrorBoundary";

function ThrowingChild() {
  throw new Error("Test error");
}

function GoodChild() {
  return <p>Contenu OK</p>;
}

describe("ErrorBoundary", () => {
  // Suppress React error boundary console.error noise
  const originalError = console.error;
  beforeAll(() => {
    console.error = (...args: unknown[]) => {
      if (
        typeof args[0] === "string" &&
        (args[0].includes("Error: Uncaught") ||
          args[0].includes("The above error occurred"))
      ) {
        return;
      }
      originalError.call(console, ...args);
    };
  });
  afterAll(() => {
    console.error = originalError;
  });

  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <GoodChild />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Contenu OK")).toBeInTheDocument();
  });

  it("renders fallback UI when a child throws", () => {
    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );
    expect(
      screen.getByText(/une erreur inattendue/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /recharger/i }),
    ).toBeInTheDocument();
  });

  it("calls window.location.reload when clicking the reload button", async () => {
    const reloadMock = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...window.location, reload: reloadMock },
    });

    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );

    await userEvent.click(
      screen.getByRole("button", { name: /recharger/i }),
    );
    expect(reloadMock).toHaveBeenCalledOnce();
  });
});
