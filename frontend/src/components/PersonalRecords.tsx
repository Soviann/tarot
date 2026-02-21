import { useState } from "react";
import { Link } from "react-router-dom";
import type { PersonalRecord } from "../types/api";
import type { Contract } from "../types/enums";
import GameDetailModal from "./GameDetailModal";
import ContractBadge from "./ui/ContractBadge";

const RECORD_CONFIG: Record<string, { icon: string; label: string }> = {
  best_score: { icon: "🏆", label: "Meilleur score" },
  best_session: { icon: "⭐", label: "Meilleure session" },
  biggest_diff: { icon: "📏", label: "Plus grand écart" },
  win_streak: { icon: "🔥", label: "Série de victoires" },
  worst_score: { icon: "💀", label: "Pire score" },
};

const DISPLAY_ORDER = ["best_score", "worst_score", "win_streak", "best_session", "biggest_diff"];

function formatRecordValue(type: string, value: number): string {
  if (type === "worst_score" && value < 0) {
    return `\u2212${Math.abs(value)}`;
  }
  if (type === "win_streak") {
    return `${value} donne${value > 1 ? "s" : ""}`;
  }
  if (type === "biggest_diff") {
    return `${value} pts`;
  }
  return String(value);
}

interface Props {
  records: PersonalRecord[];
}

export default function PersonalRecords({ records }: Props) {
  const [selectedGameId, setSelectedGameId] = useState<number | null>(null);

  if (records.length === 0) return null;

  const byType = new Map(records.map((r) => [r.type, r]));
  const sorted = DISPLAY_ORDER.map((type) => byType.get(type)).filter(
    (r): r is PersonalRecord => r !== undefined,
  );

  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-text-secondary">
        Records personnels
      </h2>
      <div className="grid grid-cols-1 gap-2">
        {sorted.map((record) => {
          const config = RECORD_CONFIG[record.type];
          if (!config) return null;
          const formattedDate = new Date(record.date).toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });

          return (
            <div
              key={record.type}
              className="flex items-center gap-3 rounded-xl bg-surface-elevated p-3"
            >
              <span className="text-xl lg:text-2xl">{config.icon}</span>
              <div className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-text-primary">
                  {config.label}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-text-muted">
                  {formattedDate}
                  {record.contract && (
                    <ContractBadge contract={record.contract as Contract} />
                  )}
                </span>
              </div>
              <div className="text-right">
                <span className={`block text-lg font-bold ${record.type === "worst_score" ? "text-score-negative" : "text-text-primary"}`}>
                  {formatRecordValue(record.type, record.value)}
                </span>
                {record.gameId ? (
                  <button
                    className="text-xs text-accent-500 hover:underline dark:text-accent-300"
                    onClick={() => setSelectedGameId(record.gameId)}
                    type="button"
                  >
                    Voir
                  </button>
                ) : record.sessionId ? (
                  <Link
                    className="text-xs text-accent-500 hover:underline dark:text-accent-300"
                    to={`/sessions/${record.sessionId}`}
                  >
                    Voir
                  </Link>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
      <GameDetailModal
        gameId={selectedGameId}
        onClose={() => setSelectedGameId(null)}
        open={selectedGameId !== null}
      />
    </section>
  );
}
