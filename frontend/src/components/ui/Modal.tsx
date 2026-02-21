import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { X } from "lucide-react";
import type { ReactNode } from "react";

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
  open: boolean;
  title: string;
}

export default function Modal({ children, onClose, open, title }: ModalProps) {
  return (
    <Dialog className="relative z-50" onClose={onClose} open={open}>
      <DialogBackdrop
        className="fixed inset-0 bg-black/50 transition-opacity duration-200 data-closed:opacity-0"
        transition
      />

      <div className="fixed inset-0 flex items-end justify-center sm:items-center">
        <DialogPanel
          className="w-full max-w-lg rounded-t-2xl bg-surface-primary p-6 shadow-xl transition duration-200 ease-out sm:rounded-2xl data-closed:translate-y-full data-closed:sm:translate-y-4 data-closed:sm:scale-95 data-closed:sm:opacity-0"
          transition
        >
          <div className="mb-4 flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold text-text-primary">
              {title}
            </DialogTitle>
            <button
              aria-label="Fermer"
              className="flex min-h-10 min-w-10 items-center justify-center rounded-full p-1 text-text-secondary transition-colors hover:bg-surface-tertiary"
              onClick={onClose}
              type="button"
            >
              <X size={20} />
            </button>
          </div>
          {children}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
