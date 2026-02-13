import { useEffect } from "react";
import { createPortal } from "react-dom";
import type { MemeConfig } from "../services/memeSelector";

interface MemeOverlayProps {
  ariaLabel?: string;
  meme: MemeConfig | null;
  onDismiss: () => void;
}

const DISPLAY_DURATION = 3000;

export default function MemeOverlay({ ariaLabel = "Mème", meme, onDismiss }: MemeOverlayProps) {
  useEffect(() => {
    if (!meme) return;

    const timer = setTimeout(onDismiss, DISPLAY_DURATION);
    return () => clearTimeout(timer);
  }, [meme, onDismiss]);

  if (!meme) return null;

  return createPortal(
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      aria-label={ariaLabel}
      className="fixed inset-0 z-60 flex animate-meme-pop-in cursor-pointer flex-col items-center justify-center bg-black/60"
      onClick={onDismiss}
      role="dialog"
    >
      <img
        alt={meme.caption}
        className="max-h-[60vh] max-w-[90vw] rounded-2xl object-contain shadow-2xl"
        src={meme.image}
      />
      <p className="mt-4 rounded-xl bg-black/80 px-6 py-3 text-center text-xl font-bold text-white shadow-lg">
        {meme.caption}
      </p>
    </div>,
    document.body,
  );
}
