import { CheckCircle, XCircle } from "lucide-react";
import type { ToastItem } from "../../hooks/useToast";

interface ToastProps {
  onDismiss: (id: string) => void;
  toast: ToastItem;
}

export default function Toast({ onDismiss, toast }: ToastProps) {
  const isError = toast.type === "error";

  return (
    <div
      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 shadow-lg
        bg-white dark:bg-surface-elevated
        animate-toast-in
        ${isError ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}
      onClick={() => onDismiss(toast.id)}
      role="status"
    >
      {isError ? <XCircle size={18} /> : <CheckCircle size={18} />}
      <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
        {toast.message}
      </span>
    </div>
  );
}
