import type { ReactNode } from "react";

interface FABProps {
  "aria-label": string;
  className?: string;
  disabled?: boolean;
  icon: ReactNode;
  onClick: () => void;
}

export default function FAB({
  "aria-label": ariaLabel,
  className = "",
  disabled = false,
  icon,
  onClick,
}: FABProps) {
  return (
    <button
      aria-label={ariaLabel}
      className={`fixed bottom-20 right-4 z-10 flex size-14 items-center justify-center rounded-full bg-accent-500 text-white shadow-lg transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100 ${className}`.trim()}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {icon}
    </button>
  );
}
