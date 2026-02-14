import { useToast } from "../../hooks/useToast";
import Toast from "./Toast";

export default function ToastContainer() {
  const { dismiss, toasts } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} onDismiss={dismiss} toast={t} />
      ))}
    </div>
  );
}
