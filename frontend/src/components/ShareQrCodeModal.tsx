import { Maximize2, X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
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
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-white">
            <button
              aria-label="Fermer le plein écran"
              className="absolute right-4 top-4 rounded-full bg-gray-100 p-2 text-gray-600 transition-colors hover:bg-gray-200"
              onClick={() => setFullscreen(false)}
              type="button"
            >
              <X size={24} />
            </button>
            <QRCodeSVG size={Math.min(window.innerWidth, window.innerHeight) * 0.7} value={sessionUrl} />
          </div>,
          document.body,
        )}
    </>
  );
}
