import { ChevronDown, Check } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

export interface SelectOption<T extends string = string> {
  label: string;
  value: T;
}

interface SelectProps<T extends string = string> {
  id?: string;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  value: T;
  variant?: "default" | "compact";
}

export default function Select<T extends string = string>({
  id,
  onChange,
  options,
  value,
  variant = "default",
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";

  const close = useCallback(() => {
    setOpen(false);
    setFocusedIndex(-1);
  }, []);

  const select = useCallback(
    (val: T) => {
      onChange(val);
      close();
    },
    [close, onChange],
  );

  useEffect(() => {
    if (!open) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [close, open]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (!open) {
          setOpen(true);
          setFocusedIndex(options.findIndex((o) => o.value === value));
        } else {
          setFocusedIndex((i) => (i + 1) % options.length);
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (open) {
          setFocusedIndex((i) => (i - 1 + options.length) % options.length);
        }
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        if (open && focusedIndex >= 0) {
          select(options[focusedIndex].value);
        } else {
          setOpen(true);
          setFocusedIndex(options.findIndex((o) => o.value === value));
        }
        break;
      case "Escape":
        e.preventDefault();
        close();
        break;
    }
  };

  useEffect(() => {
    if (open && focusedIndex >= 0 && listRef.current) {
      const item = listRef.current.children[focusedIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: "nearest" });
    }
  }, [focusedIndex, open]);

  const isCompact = variant === "compact";

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={open}
        aria-haspopup="listbox"
        className={
          isCompact
            ? "flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-primary px-3 py-2 text-sm text-text-primary transition-colors hover:bg-surface-secondary"
            : "flex w-full items-center justify-between rounded-xl bg-surface-elevated px-4 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-secondary"
        }
        id={id}
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) {
            setFocusedIndex(options.findIndex((o) => o.value === value));
          }
        }}
        onKeyDown={handleKeyDown}
        type="button"
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown
          className={`shrink-0 text-text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          size={isCompact ? 14 : 16}
        />
      </button>

      {open && (
        <div
          className={`absolute z-50 mt-1 overflow-hidden rounded-xl border border-surface-border bg-surface-elevated py-1 shadow-lg animate-fade-in ${
            isCompact ? "right-0 min-w-44" : "left-0 right-0"
          }`}
          ref={listRef}
          role="listbox"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isFocused = index === focusedIndex;

            return (
              <button
                aria-selected={isSelected}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                  isSelected
                    ? "font-semibold text-accent-500 dark:text-accent-300"
                    : "text-text-primary"
                } ${isFocused ? "bg-surface-secondary" : "hover:bg-surface-secondary"}`}
                key={option.value}
                onClick={() => select(option.value)}
                onMouseEnter={() => setFocusedIndex(index)}
                role="option"
                type="button"
              >
                <span className="flex-1">{option.label}</span>
                {isSelected && (
                  <Check className="shrink-0 text-accent-500 dark:text-accent-300" size={16} />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
