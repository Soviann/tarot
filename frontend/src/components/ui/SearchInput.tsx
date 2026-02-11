import { Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useDebounce } from "../../hooks/useDebounce";

interface SearchInputProps {
  className?: string;
  clearKey?: number;
  debounceMs?: number;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSearch: (value: string) => void;
  placeholder?: string;
}

export default function SearchInput({
  className = "",
  clearKey,
  debounceMs = 300,
  inputProps,
  onKeyDown,
  onSearch,
  placeholder,
}: SearchInputProps) {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, debounceMs);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    onSearch(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  useEffect(() => {
    if (clearKey) setQuery("");
  }, [clearKey]);

  return (
    <div className={`relative ${className}`.trim()}>
      <Search
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
        size={18}
      />
      <input
        {...inputProps}
        className="w-full rounded-lg border border-surface-border bg-surface-primary py-2 pl-10 pr-9 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-400 focus:outline-none focus:ring-1 focus:ring-accent-400"
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        type="search"
        value={query}
      />
      {query && (
        <button
          aria-label="Effacer"
          className="absolute right-2 top-1/2 flex min-h-8 min-w-8 -translate-y-1/2 items-center justify-center rounded-full p-0.5 text-text-muted hover:text-text-secondary"
          onClick={() => setQuery("")}
          type="button"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
