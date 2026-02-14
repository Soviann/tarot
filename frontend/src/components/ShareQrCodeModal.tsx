import { Maximize2, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Modal from "./ui/Modal";

interface ShareQrCodeModalProps {
  onClose: () => void;
  open: boolean;
  sessionId: number;
}

export default function ShareQrCodeModal({
  onClose,
  open,
  sessionId,
}: ShareQrCodeModalProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const sessionUrl = `${window.location.origin}/sessions/${sessionId}`;

  const handleClose = () => {
    setFullscreen(false);
    onClose();
  };

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") setFullscreen(false);
  }, []);

  useEffect(() => {
    if (!fullscreen) return;
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [fullscreen, handleEscape]);

  return (
    <>
      <Modal onClose={handleClose} open={open} title="Partager la session">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-xl bg-white p-4">
            <QRCodeSVG size={200} value={sessionUrl} />
          </div>
          <p className="break-all text-center text-sm text-text-secondary">
            {sessionUrl}
          </p>
          <button
            className="flex items-center gap-2 rounded-lg bg-surface-secondary px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-tertiary"
            onClick={() => setFullscreen(true)}
            type="button"
          >
            <Maximize2 size={16} />
            Plein écran
          </button>
        </div>
      </Modal>

      {fullscreen &&
        createPortal(
          // White background is intentional: QR codes need high contrast for scanning
          <div
            aria-label="QR code plein écran"
            aria-modal="true"
            className="fixed inset-0 z-[60] flex items-center justify-center bg-white"
            role="dialog"
          >
            <button
              aria-label="Fermer le plein écran"
              className="absolute right-4 top-4 rounded-full bg-surface-secondary p-2 text-text-secondary transition-colors hover:bg-surface-tertiary"
              onClick={() => setFullscreen(false)}
              type="button"
            >
              <X size={24} />
            </button>
            <QRCodeSVG className="h-[70vmin] w-[70vmin]" value={sessionUrl} />
          </div>,
          document.body,
        )}
    </>
  );
}
