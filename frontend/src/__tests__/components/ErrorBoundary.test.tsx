import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import App from "../../App";

let shouldThrow = false;

function ThrowingChild() {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <p>Contenu OK</p>;
}

// Minimal test wrapper that imports App's ErrorBoundary setup
// but we test via the actual App component isn't practical here.
// Instead, test the fallback render used in App.tsx.

describe("ErrorBoundary (react-error-boundary)", () => {
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

  it("renders children when no error", async () => {
    // We need to test the ErrorBoundary as used in App
    // Import the fallback component directly
    const { ErrorFallback } = await import(
      "../../components/ErrorFallback"
    );
    const { ErrorBoundary } = await import("react-error-boundary");

    shouldThrow = false;
    render(
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <ThrowingChild />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Contenu OK")).toBeInTheDocument();
  });

  it("renders fallback UI with retry button when a child throws", async () => {
    const { ErrorFallback } = await import(
      "../../components/ErrorFallback"
    );
    const { ErrorBoundary } = await import("react-error-boundary");

    shouldThrow = true;
    render(
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <ThrowingChild />
      </ErrorBoundary>,
    );
    expect(
      screen.getByText(/une erreur inattendue/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /réessayer/i }),
    ).toBeInTheDocument();
  });

  it("resets error state when clicking retry button", async () => {
    const { ErrorFallback } = await import(
      "../../components/ErrorFallback"
    );
    const { ErrorBoundary } = await import("react-error-boundary");

    shouldThrow = true;
    render(
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <ThrowingChild />
      </ErrorBoundary>,
    );

    // Fallback is shown
    expect(
      screen.getByText(/une erreur inattendue/i),
    ).toBeInTheDocument();

    // Fix the error, then click retry
    shouldThrow = false;
    await userEvent.click(
      screen.getByRole("button", { name: /réessayer/i }),
    );

    // Children should render again
    expect(screen.getByText("Contenu OK")).toBeInTheDocument();
  });

  it("logs errors to console", async () => {
    const { ErrorFallback } = await import(
      "../../components/ErrorFallback"
    );
    const { ErrorBoundary } = await import("react-error-boundary");

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    shouldThrow = true;
    render(
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onError={(error: Error) => console.error("ErrorBoundary caught:", error)}
      >
        <ThrowingChild />
      </ErrorBoundary>,
    );

    expect(errorSpy).toHaveBeenCalledWith(
      "ErrorBoundary caught:",
      expect.any(Error),
    );
    errorSpy.mockRestore();
  });
});
