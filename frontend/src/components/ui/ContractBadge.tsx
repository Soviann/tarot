import type { Contract } from "../../types/enums";

interface ContractBadgeProps {
  className?: string;
  contract: Contract;
}

const contractConfig: Record<Contract, { colorClass: string; label: string }> = {
  garde: { colorClass: "bg-contract-garde", label: "Garde" },
  garde_contre: { colorClass: "bg-contract-garde-contre", label: "Garde Contre" },
  garde_sans: { colorClass: "bg-contract-garde-sans", label: "Garde Sans" },
  petite: { colorClass: "bg-contract-petite", label: "Petite" },
};

export default function ContractBadge({ className = "", contract }: ContractBadgeProps) {
  const { colorClass, label } = contractConfig[contract];

  return (
    <span
      className={`${colorClass} inline-block rounded-full px-2.5 py-0.5 text-xs font-medium text-white ${className}`.trim()}
    >
      {label}
    </span>
  );
}
