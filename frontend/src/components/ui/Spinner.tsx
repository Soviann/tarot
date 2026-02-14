interface SpinnerProps {
  className?: string;
  inline?: boolean;
  size?: "md" | "sm" | "xs";
}

const SIZES = { md: 32, sm: 20, xs: 16 } as const;
const PADDING = { md: "py-8", sm: "py-4" } as const;

export default function Spinner({ className, inline = false, size = "md" }: SpinnerProps) {
  const px = SIZES[size];
  const svg = (
    <svg
      className={`animate-spin ${className ?? "text-accent-500"}`}
      fill="none"
      height={px}
      viewBox="0 0 24 24"
      width={px}
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        fill="currentColor"
      />
    </svg>
  );

  if (inline) return svg;

  return (
    <div className={`flex justify-center ${PADDING[size as keyof typeof PADDING] ?? ""}`} role="status">
      {svg}
      <span className="sr-only">Chargement</span>
    </div>
  );
}
