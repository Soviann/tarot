import { EllipsisVertical } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
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
  const menuRef = useRef<HTMLDivElement>(null);
  const focusIndexRef = useRef(-1);

  const close = useCallback(() => {
    focusIndexRef.current = -1;
    setOpen(false);
  }, []);

  const focusItem = useCallback((startIndex: number, direction: 1 | -1) => {
    const menu = menuRef.current;
    if (!menu) return;
    const menuItems = menu.querySelectorAll<HTMLElement>('[role="menuitem"]');
    const count = menuItems.length;
    if (count === 0) return;
    // Skip disabled items
    for (let i = 0; i < count; i++) {
      const index = ((startIndex + i * direction) % count + count) % count;
      const el = menuItems[index];
      if (!el.hasAttribute("disabled")) {
        focusIndexRef.current = index;
        el.focus();
        return;
      }
    }
  }, []);

  const handleMenuKeyDown = useCallback(
    (e: ReactKeyboardEvent) => {
      const menu = menuRef.current;
      if (!menu) return;
      const count = menu.querySelectorAll('[role="menuitem"]').length;
      if (count === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = focusIndexRef.current === -1 ? 0 : (focusIndexRef.current + 1) % count;
        focusItem(next, 1);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const next = focusIndexRef.current === -1 ? count - 1 : (focusIndexRef.current - 1 + count) % count;
        focusItem(next, -1);
      }
    },
    [focusItem],
  );

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
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={label}
        className="rounded-lg p-1 text-text-secondary lg:p-2"
        onClick={() => setOpen((prev) => !prev)}
        type="button"
      >
        <EllipsisVertical size={20} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full z-50 mt-1 min-w-44 rounded-lg border border-surface-border bg-surface-elevated py-1 shadow-lg"
          onKeyDown={handleMenuKeyDown}
          ref={menuRef}
          role="menu"
        >
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
                  role="menuitem"
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
                role="menuitem"
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
