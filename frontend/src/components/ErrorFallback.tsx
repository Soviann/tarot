import type { FallbackProps } from "react-error-boundary";

export function ErrorFallback({ resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
        Une erreur inattendue est survenue.
      </p>
      <button
        className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        onClick={resetErrorBoundary}
        type="button"
      >
        Réessayer
      </button>
    </div>
  );
}
