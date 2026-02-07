import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import GameList from "../components/GameList";
import InProgressBanner from "../components/InProgressBanner";
import Scoreboard from "../components/Scoreboard";
import { FAB } from "../components/ui";
import { useCreateGame } from "../hooks/useCreateGame";
import { useSession } from "../hooks/useSession";
import { GameStatus } from "../types/enums";

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sessionId = Number(id);
  const { isPending, session } = useSession(sessionId);
  const createGame = useCreateGame(sessionId);

  const inProgressGame = useMemo(
    () => session?.games.find((g) => g.status === GameStatus.InProgress) ?? null,
    [session],
  );

  const completedGames = useMemo(
    () => session?.games.filter((g) => g.status === GameStatus.Completed) ?? [],
    [session],
  );

  if (isPending) {
    return (
      <div className="p-4 text-center text-text-muted">Chargement…</div>
    );
  }

  if (!session) {
    return (
      <div className="p-4 text-center text-text-muted">
        Session introuvable
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 pb-24">
      <div className="flex items-center gap-2">
        <button
          aria-label="Retour"
          className="rounded-lg p-1 text-text-secondary"
          onClick={() => navigate("/")}
          type="button"
        >
          <svg
            className="size-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              d="M15 19l-7-7 7-7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-text-primary">
          Session #{session.id}
        </h1>
      </div>

      <Scoreboard
        cumulativeScores={session.cumulativeScores}
        players={session.players}
      />

      {inProgressGame && (
        <InProgressBanner
          game={inProgressGame}
          onComplete={() => {
            // Placeholder — issue #9
          }}
        />
      )}

      <div>
        <h2 className="mb-2 text-sm font-semibold text-text-secondary">
          Historique des donnes
        </h2>
        <GameList
          games={completedGames}
          onEditLast={() => {
            // Placeholder — issue #9
          }}
        />
      </div>

      <FAB
        aria-label="Nouvelle donne"
        disabled={!!inProgressGame || createGame.isPending}
        icon={
          <svg
            className="size-6"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              d="M12 4v16m8-8H4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        }
        onClick={() => {
          // Placeholder — issue #9
        }}
      />
    </div>
  );
}
