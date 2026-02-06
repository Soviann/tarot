import { Contract } from "../../types/enums";
import type { Contract as ContractType } from "../../types/enums";

interface ContractBadgeProps {
  className?: string;
  contract: ContractType;
}

const contractConfig: Record<ContractType, { colorClass: string; label: string }> = {
  [Contract.Garde]: { colorClass: "bg-contract-garde", label: "Garde" },
  [Contract.GardeContre]: { colorClass: "bg-contract-garde-contre", label: "Garde Contre" },
  [Contract.GardeSans]: { colorClass: "bg-contract-garde-sans", label: "Garde Sans" },
  [Contract.Petite]: { colorClass: "bg-contract-petite", label: "Petite" },
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
