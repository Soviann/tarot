import { Layers } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useSessions } from "../hooks/useSessions";
import { formatRelativeDate } from "../services/formatRelativeDate";
import { PlayerAvatar } from "./ui";

export const EMPTY_STATE_MESSAGES = [
  "Les cartes n'attendent que vous ! Sélectionnez 5 joueurs pour commencer.",
  "La table est prête, il ne manque plus que les joueurs !",
  "Aucune session pour l'instant… C'est le moment de distribuer !",
  "Le tarot, c'est mieux à plusieurs. Lancez votre première session !",
  "Qui prend ? Créez une session pour le découvrir !",
  "Petit, Garde ou Garde Sans ? Il n'y a qu'une façon de le savoir…",
  "Le donneur est prêt. Et vous ?",
];

export default function SessionList() {
  const { isPending, sessions } = useSessions();

  const emptyMessage = useMemo(
    () => EMPTY_STATE_MESSAGES[Math.floor(Math.random() * EMPTY_STATE_MESSAGES.length)],
    [],
  );

  if (isPending) {
    return <p className="py-4 text-center text-text-muted">Chargement…</p>;
  }

  if (sessions.length === 0) {
    return (
      <div
        className="flex flex-col items-center gap-3 py-8 text-center"
        data-testid="empty-state"
      >
        <Layers className="text-text-muted" size={40} />
        <p className="text-text-muted">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {sessions.map((session) => (
          <li key={session.id}>
            <Link
              className="block rounded-lg bg-surface-secondary p-3 transition-colors hover:bg-surface-tertiary"
              to={`/sessions/${session.id}`}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-1">
                  {session.players.map((p) => (
                    <PlayerAvatar
                      color={p.color}
                      key={p.id}
                      name={p.name}
                      playerId={p.id}
                      size="sm"
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-text-muted">
                    {formatRelativeDate(session.lastPlayedAt)}
                  </p>
                  {session.isActive ? (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900 dark:text-green-300">
                      En cours
                    </span>
                  ) : (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      Terminée
                    </span>
                  )}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
