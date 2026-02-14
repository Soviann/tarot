import type { ReactNode } from "react";

interface EmptyStateProps {
  action?: { label: string; onClick: () => void };
  icon: ReactNode;
  message: string;
}

export default function EmptyState({ action, icon, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-8 text-center">
      <div className="text-text-muted">{icon}</div>
      <p className="text-text-muted">{message}</p>
      {action && (
        <button
          className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-600"
          onClick={action.onClick}
          type="button"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
