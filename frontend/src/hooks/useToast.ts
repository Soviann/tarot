import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";

export interface ToastItem {
  id: string;
  message: string;
  type: "error" | "success";
}

interface ToastContextValue {
  dismiss: (id: string) => void;
  toast: (message: string) => void;
  toastError: (message: string) => void;
  toasts: ToastItem[];
}

const MAX_TOASTS = 3;
const SUCCESS_DURATION = 2000;
const ERROR_DURATION = 3000;

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (message: string, type: "error" | "success") => {
      const id = String(++nextId);
      const duration = type === "error" ? ERROR_DURATION : SUCCESS_DURATION;

      setToasts((prev) => {
        const next = [...prev, { id, message, type }];
        return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next;
      });

      const timer = setTimeout(() => {
        dismiss(id);
      }, duration);
      timersRef.current.set(id, timer);
    },
    [dismiss],
  );

  const toast = useCallback(
    (message: string) => addToast(message, "success"),
    [addToast],
  );

  const toastError = useCallback(
    (message: string) => addToast(message, "error"),
    [addToast],
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  return createElement(
    ToastContext.Provider,
    { value: { dismiss, toast, toastError, toasts } },
    children,
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
