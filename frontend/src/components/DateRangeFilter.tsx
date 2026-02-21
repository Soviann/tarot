interface DateRangeFilterProps {
  from: string | null;
  onChange: (from: string | null, to: string | null) => void;
  to: string | null;
}

interface Preset {
  computeFrom: () => string;
  label: string;
}

function todayParts(): { day: number; month: number; year: number } {
  const now = new Date();
  return { day: now.getDate(), month: now.getMonth(), year: now.getFullYear() };
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatLocalDate(year: number, month: number, day: number): string {
  // Construct via local time to avoid timezone offset issues
  const d = new Date(year, month, day);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function todayStr(): string {
  const { day, month, year } = todayParts();
  return formatLocalDate(year, month, day);
}

const PRESETS: Preset[] = [
  {
    computeFrom: () => {
      const { day, month, year } = todayParts();
      return formatLocalDate(year, month, day - 30);
    },
    label: "30j",
  },
  {
    computeFrom: () => {
      const { day, month, year } = todayParts();
      return formatLocalDate(year, month - 3, day);
    },
    label: "3 mois",
  },
  {
    computeFrom: () => {
      const { day, month, year } = todayParts();
      return formatLocalDate(year, month - 6, day);
    },
    label: "6 mois",
  },
  {
    computeFrom: () => {
      const { day, month, year } = todayParts();
      return formatLocalDate(year - 1, month, day);
    },
    label: "1 an",
  },
];

function isPresetActive(preset: Preset, from: string | null, to: string | null): boolean {
  if (null === from || null === to) return false;
  return from === preset.computeFrom() && to === todayStr();
}

function isToutActive(from: string | null, to: string | null): boolean {
  return null === from && null === to;
}

export default function DateRangeFilter({ from, onChange, to }: DateRangeFilterProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex flex-wrap justify-center gap-2">
        {PRESETS.map((preset) => (
          <button
            className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
              isPresetActive(preset, from, to)
                ? "bg-accent-500 text-white"
                : "bg-surface-elevated text-text-secondary hover:bg-surface-tertiary"
            }`}
            key={preset.label}
            onClick={() => onChange(preset.computeFrom(), todayStr())}
            type="button"
          >
            {preset.label}
          </button>
        ))}
        <button
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            isToutActive(from, to)
              ? "bg-accent-500 text-white"
              : "bg-surface-elevated text-text-secondary hover:bg-surface-tertiary"
          }`}
          onClick={() => onChange(null, null)}
          type="button"
        >
          Tout
        </button>
      </div>
      <div className="flex items-center justify-center gap-3">
        <label className="flex items-center gap-2 text-sm font-medium text-text-secondary" htmlFor="date-from">
          De
          <input
            className="rounded-xl border border-border bg-surface-elevated px-3 py-1.5 text-sm text-text-primary shadow-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500 dark:border-border-dark"
            id="date-from"
            onChange={(e) => onChange(e.target.value || null, to)}
            type="date"
            value={from ?? ""}
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-text-secondary" htmlFor="date-to">
          À
          <input
            className="rounded-xl border border-border bg-surface-elevated px-3 py-1.5 text-sm text-text-primary shadow-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500 dark:border-border-dark"
            id="date-to"
            onChange={(e) => onChange(from, e.target.value || null)}
            type="date"
            value={to ?? ""}
          />
        </label>
      </div>
    </div>
  );
}
