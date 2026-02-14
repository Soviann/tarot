import { EllipsisVertical } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

interface OverflowMenuItemBase {
  icon: ReactNode;
  label: string;
}

interface OverflowMenuButtonItem extends OverflowMenuItemBase {
  disabled?: boolean;
  onClick: () => void;
}

interface OverflowMenuLinkItem extends OverflowMenuItemBase {
  href: string;
}

export type OverflowMenuItem = OverflowMenuButtonItem | OverflowMenuLinkItem;

interface OverflowMenuProps {
  items: OverflowMenuItem[];
  label: string;
}

export default function OverflowMenu({ items, label }: OverflowMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [close, open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-label={label}
        className="rounded-lg p-1 text-text-secondary lg:p-2"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <EllipsisVertical size={20} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-44 rounded-lg border border-surface-border bg-surface-elevated py-1 shadow-lg">
          {items.map((item) => {
            const content = (
              <>
                <span className="text-text-secondary">{item.icon}</span>
                <span>{item.label}</span>
              </>
            );

            if ("href" in item) {
              return (
                <Link
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-primary hover:bg-surface-secondary"
                  key={item.label}
                  onClick={close}
                  to={item.href}
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-text-primary hover:bg-surface-secondary disabled:opacity-40 disabled:hover:bg-surface-elevated"
                disabled={item.disabled}
                key={item.label}
                onClick={() => {
                  item.onClick();
                  close();
                }}
                type="button"
              >
                {content}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
