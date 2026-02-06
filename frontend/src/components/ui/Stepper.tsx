import { Minus, Plus } from "lucide-react";

interface StepperProps {
  className?: string;
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  value: number;
}

export default function Stepper({
  className = "",
  label,
  max,
  min,
  onChange,
  value,
}: StepperProps) {
  return (
    <div
      aria-label={label}
      className={`flex items-center gap-3 ${className}`.trim()}
      role="group"
    >
      <button
        aria-label="Diminuer"
        className="flex size-11 items-center justify-center rounded-full border border-surface-border bg-surface-primary text-text-primary transition-colors hover:bg-surface-tertiary disabled:opacity-40"
        disabled={value <= min}
        onClick={() => onChange(value - 1)}
        type="button"
      >
        <Minus size={18} />
      </button>
      <div aria-valuemax={max} aria-valuemin={min} aria-valuenow={value} className="min-w-12 text-center" role="status">
        <div className="text-lg font-semibold tabular-nums text-text-primary">{value}</div>
        <div className="text-xs text-text-secondary">{label}</div>
      </div>
      <button
        aria-label="Augmenter"
        className="flex size-11 items-center justify-center rounded-full border border-surface-border bg-surface-primary text-text-primary transition-colors hover:bg-surface-tertiary disabled:opacity-40"
        disabled={value >= max}
        onClick={() => onChange(value + 1)}
        type="button"
      >
        <Plus size={18} />
      </button>
    </div>
  );
}
