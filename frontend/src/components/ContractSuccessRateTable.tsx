import type { ContractSuccessRatePlayer, PlayerContractEntry } from "../types/api";
import { Contract } from "../types/enums";
import PlayerAvatar from "./ui/PlayerAvatar";

interface ContractSuccessRateTableProps {
  data: ContractSuccessRatePlayer[];
}

const CONTRACT_COLUMNS: { key: Contract; label: string }[] = [
  { key: Contract.Petite, label: "Petite" },
  { key: Contract.Garde, label: "Garde" },
  { key: Contract.GardeSans, label: "G. Sans" },
  { key: Contract.GardeContre, label: "G. Contre" },
];

function getCellColor(winRate: number): string {
  if (winRate >= 70) return "text-green-500";
  if (winRate >= 50) return "text-text-primary";
  if (winRate >= 30) return "text-orange-400";
  return "text-red-400";
}

function ContractCell({ entry }: { entry: PlayerContractEntry | undefined }) {
  if (!entry) {
    return <span className="text-text-muted">–</span>;
  }

  return (
    <div className="flex flex-col items-center">
      <span className={`text-sm font-semibold ${getCellColor(entry.winRate)}`}>
        {Math.round(entry.winRate)}%
      </span>
      <span className="text-xs text-text-muted">({entry.count})</span>
    </div>
  );
}

export default function ContractSuccessRateTable({ data }: ContractSuccessRateTableProps) {
  if (data.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-text-muted">
        Aucune donnée disponible
      </p>
    );
  }

  const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="overflow-x-auto rounded-xl bg-surface-elevated">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-surface-border">
            <th className="px-3 py-2 text-left text-xs font-medium text-text-muted">
              Joueur
            </th>
            {CONTRACT_COLUMNS.map((col) => (
              <th
                className="px-2 py-2 text-center text-xs font-medium text-text-muted"
                key={col.key}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((player) => {
            const contractMap = new Map(
              player.contracts.map((c) => [c.contract, c]),
            );
            return (
              <tr
                className="border-b border-surface-border last:border-b-0"
                key={player.id}
              >
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <PlayerAvatar color={player.color} name={player.name} size="sm" />
                    <span className="font-medium text-text-primary">
                      {player.name}
                    </span>
                  </div>
                </td>
                {CONTRACT_COLUMNS.map((col) => (
                  <td className="px-2 py-2 text-center" key={col.key}>
                    <ContractCell entry={contractMap.get(col.key)} />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
