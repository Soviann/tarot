import { useState } from "react";
import type { Badge } from "../types/api";

interface BadgeGridProps {
  badges: Badge[];
}

export default function BadgeGrid({ badges }: BadgeGridProps) {
  const [showLocked, setShowLocked] = useState(false);

  const unlocked = badges.filter((b) => b.unlockedAt !== null);
  const locked = badges.filter((b) => b.unlockedAt === null);
  const displayed = showLocked ? [...unlocked, ...locked] : unlocked;

  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-text-secondary">
        Badges ({unlocked.length}/{badges.length})
      </h2>
      <div className="grid grid-cols-3 gap-2 lg:grid-cols-5">
        {displayed.map((badge) => (
          <div
            key={badge.type}
            className={`flex flex-col items-center gap-1 rounded-xl p-3 text-center ${
              badge.unlockedAt
                ? "bg-surface-elevated"
                : "bg-surface-secondary opacity-40"
            }`}
          >
            <span className="text-2xl">{badge.emoji}</span>
            <span className="text-xs font-medium leading-tight text-text-primary">{badge.label}</span>
            {badge.unlockedAt ? (
              <span className="text-[10px] text-text-muted">
                {new Date(badge.unlockedAt).toLocaleDateString("fr-FR")}
              </span>
            ) : (
              <span className="text-[10px] leading-tight text-text-muted">{badge.description}</span>
            )}
          </div>
        ))}
      </div>
      {locked.length > 0 && (
        <button
          className="mt-3 w-full rounded-lg bg-surface-secondary py-2 text-xs font-medium text-text-secondary"
          onClick={() => setShowLocked((prev) => !prev)}
          type="button"
        >
          {showLocked
            ? "Masquer les badges verrouillés"
            : `Voir les ${locked.length} restant${locked.length > 1 ? "s" : ""}`}
        </button>
      )}
    </section>
  );
}
