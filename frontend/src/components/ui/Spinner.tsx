interface SpinnerProps {
  size?: "md" | "sm";
}

const SIZES = { md: 32, sm: 20 } as const;
const PADDING = { md: "py-8", sm: "py-4" } as const;

export default function Spinner({ size = "md" }: SpinnerProps) {
  const px = SIZES[size];
  return (
    <div className={`flex justify-center ${PADDING[size]}`} role="status">
      <svg
        className="animate-spin text-accent-500"
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
      <span className="sr-only">Chargement</span>
    </div>
  );
}
