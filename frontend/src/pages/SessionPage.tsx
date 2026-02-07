import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import CompleteGameModal from "../components/CompleteGameModal";
import GameList from "../components/GameList";
import InProgressBanner from "../components/InProgressBanner";
import NewGameModal from "../components/NewGameModal";
import Scoreboard from "../components/Scoreboard";
import ScoreEvolutionChart from "../components/ScoreEvolutionChart";
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

  const lastCompletedGame = useMemo(
    () =>
      completedGames.length > 0
        ? completedGames.reduce((a, b) => (a.position > b.position ? a : b))
        : null,
    [completedGames],
  );

  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [newGameModalOpen, setNewGameModalOpen] = useState(false);

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
          onComplete={() => setCompleteModalOpen(true)}
        />
      )}

      {completedGames.length >= 2 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-text-secondary">
            Évolution des scores
          </h2>
          <ScoreEvolutionChart
            games={session.games}
            players={session.players}
          />
        </section>
      )}

      <div>
        <h2 className="mb-2 text-sm font-semibold text-text-secondary">
          Historique des donnes
        </h2>
        <GameList
          games={completedGames}
          onEditLast={() => setEditModalOpen(true)}
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
        onClick={() => setNewGameModalOpen(true)}
      />

      <NewGameModal
        createGame={createGame}
        onClose={() => setNewGameModalOpen(false)}
        open={newGameModalOpen}
        players={session.players}
      />

      {inProgressGame && (
        <CompleteGameModal
          game={inProgressGame}
          onClose={() => setCompleteModalOpen(false)}
          open={completeModalOpen}
          players={session.players}
          sessionId={sessionId}
        />
      )}

      {lastCompletedGame && (
        <CompleteGameModal
          game={lastCompletedGame}
          onClose={() => setEditModalOpen(false)}
          open={editModalOpen}
          players={session.players}
          sessionId={sessionId}
        />
      )}
    </div>
  );
}
