import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";

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
  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";
  const isCompact = variant === "compact";

  return (
    <Listbox onChange={onChange} value={value}>
      <div className="relative">
        <ListboxButton
          className={
            isCompact
              ? "group flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-primary px-3 py-2 text-sm text-text-primary transition-colors hover:bg-surface-secondary"
              : "group flex w-full items-center justify-between rounded-xl bg-surface-elevated px-4 py-3 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-secondary"
          }
          id={id}
        >
          <span className="truncate">{selectedLabel}</span>
          <ChevronDown
            className="shrink-0 text-text-muted transition-transform duration-200 group-data-open:rotate-180"
            size={isCompact ? 14 : 16}
          />
        </ListboxButton>

        <ListboxOptions
          className={`absolute z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-surface-border bg-surface-elevated py-1 shadow-lg transition duration-200 ease-out data-closed:scale-95 data-closed:opacity-0 ${
            isCompact ? "right-0 min-w-44" : "left-0 right-0"
          }`}
          transition
        >
          {options.map((option) => (
            <ListboxOption
              className="group flex w-full cursor-pointer items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors data-focus:bg-surface-secondary data-selected:font-semibold data-selected:text-accent-500 dark:data-selected:text-accent-300"
              key={option.value}
              value={option.value}
            >
              <span className="flex-1">{option.label}</span>
              <Check
                className="invisible shrink-0 text-accent-500 group-data-selected:visible dark:text-accent-300"
                size={16}
              />
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}
