import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorBoundary } from "react-error-boundary";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorFallback } from "../../components/ErrorFallback";

let shouldThrow = false;

function ThrowingChild() {
  if (shouldThrow) {
    throw new Error("Test error");
  }
  return <p>Contenu OK</p>;
}

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
  beforeEach(() => {
    shouldThrow = false;
  });

  it("renders children when no error", () => {
    render(
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <ThrowingChild />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Contenu OK")).toBeInTheDocument();
  });

  it("renders fallback UI with retry button when a child throws", () => {
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
    shouldThrow = true;
    render(
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <ThrowingChild />
      </ErrorBoundary>,
    );

    expect(
      screen.getByText(/une erreur inattendue/i),
    ).toBeInTheDocument();

    shouldThrow = false;
    await userEvent.click(
      screen.getByRole("button", { name: /réessayer/i }),
    );

    expect(screen.getByText("Contenu OK")).toBeInTheDocument();
  });

  it("logs errors to console", () => {
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
