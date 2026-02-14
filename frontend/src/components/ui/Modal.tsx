import { X } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
  open: boolean;
  title: string;
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"]), [contenteditable]';

export default function Modal({ children, onClose, open, title }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  // Open: mount portal then trigger enter animation on next frame
  // Close: start exit animation, unmount after transition or safety timeout
  useEffect(() => {
    if (open) {
      setVisible(true);
      const raf = requestAnimationFrame(() => setAnimateIn(true));
      return () => cancelAnimationFrame(raf);
    } else if (visible) {
      setAnimateIn(false);
      // Safety fallback: unmount after animation duration in case transitionend doesn't fire
      const timeout = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timeout);
    }
  }, [open, visible]);

  const handleTransitionEnd = useCallback(() => {
    if (!open) {
      setVisible(false);
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusable =
          dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;

    document.addEventListener("keydown", handleKeyDown);
    const previouslyFocused = document.activeElement as HTMLElement | null;

    const timer = setTimeout(() => {
      const first =
        dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
      first?.focus();
    }, 0);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
      previouslyFocused?.focus();
    };
  }, [handleKeyDown, open]);

  if (!visible) return null;

  return createPortal(
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center transition-opacity duration-200 sm:items-center ${animateIn ? "opacity-100 bg-black/50" : "opacity-0 bg-black/0"}`}
      onClick={onClose}
    >
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className={`w-full max-w-lg rounded-t-2xl bg-surface-primary p-6 shadow-xl transition-transform duration-200 ease-out sm:rounded-2xl ${animateIn ? "translate-y-0" : "translate-y-full"}`}
        onClick={(e) => e.stopPropagation()}
        onTransitionEnd={handleTransitionEnd}
        ref={dialogRef}
        role="dialog"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary" id={titleId}>
            {title}
          </h2>
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
      </div>
    </div>,
    document.body,
  );
}
