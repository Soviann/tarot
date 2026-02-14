import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, QrCode } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AddStarModal from "../components/AddStarModal";
import ChangeDealerModal from "../components/ChangeDealerModal";
import CompleteGameModal from "../components/CompleteGameModal";
import DeleteGameModal from "../components/DeleteGameModal";
import GameList from "../components/GameList";
import InProgressBanner from "../components/InProgressBanner";
import MemeOverlay from "../components/MemeOverlay";
import NewGameModal from "../components/NewGameModal";
import Scoreboard from "../components/Scoreboard";
import ScoreEvolutionChart from "../components/ScoreEvolutionChart";
import SessionGroupSelector from "../components/SessionGroupSelector";
import ShareQrCodeModal from "../components/ShareQrCodeModal";
import SwapPlayersModal from "../components/SwapPlayersModal";
import { FAB, UndoFAB } from "../components/ui";
import { useAddStar } from "../hooks/useAddStar";
import { useCreateGame } from "../hooks/useCreateGame";
import { useSession } from "../hooks/useSession";
import { useSessionGames } from "../hooks/useSessionGames";
import { useUpdateDealer } from "../hooks/useUpdateDealer";
import { apiFetch } from "../services/api";
import type { GameContext, MemeConfig } from "../services/memeSelector";
import { selectDefeatMeme, selectVictoryMeme } from "../services/memeSelector";

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const sessionId = Number(id);
  const { isPending, session } = useSession(sessionId);
  const {
    data: gamesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useSessionGames(sessionId);
  const addStar = useAddStar(sessionId);
  const createGame = useCreateGame(sessionId);
  const updateDealer = useUpdateDealer(sessionId);

  const inProgressGame = session?.inProgressGame ?? null;

  const completedGames = useMemo(
    () => gamesData?.pages.flatMap((p) => p.member) ?? [],
    [gamesData],
  );

  const lastCompletedGame = completedGames[0] ?? null;

  const lastGame = inProgressGame ?? lastCompletedGame;

  const queryClient = useQueryClient();
  const [activeMeme, setActiveMeme] = useState<MemeConfig | null>(null);
  const [memeLabel, setMemeLabel] = useState<string | undefined>(undefined);
  const [changeDealerModalOpen, setChangeDealerModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [newGameModalOpen, setNewGameModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [starModalOpen, setStarModalOpen] = useState(false);
  const [starPlayerId, setStarPlayerId] = useState<number | null>(null);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [undoGameId, setUndoGameId] = useState<number | null>(null);

  const handleGameCompleted = useCallback((ctx: GameContext) => {
    const victoryMeme = selectVictoryMeme(ctx);
    if (victoryMeme) {
      setMemeLabel("Mème de victoire");
      setActiveMeme(victoryMeme);
      return;
    }
    const defeatMeme = selectDefeatMeme(ctx);
    if (defeatMeme) {
      setMemeLabel("Mème de défaite");
      setActiveMeme(defeatMeme);
    }
  }, []);

  const handleGameSaved = useCallback((gameId: number) => {
    setUndoGameId(gameId);
  }, []);

  const handleUndo = useCallback(async () => {
    if (undoGameId === null) return;
    const gameId = undoGameId;
    setUndoGameId(null);
    await apiFetch<void>(`/games/${gameId}`, { method: "DELETE" });
    queryClient.invalidateQueries({ queryKey: ["session", sessionId] });
  }, [queryClient, sessionId, undoGameId]);

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
    <div className="flex flex-col gap-4 p-4 pb-24 lg:p-8 lg:pb-28">
      <div className="flex items-center gap-2">
        <button
          aria-label="Retour"
          className="rounded-lg p-1 text-text-secondary lg:p-2"
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
        <SessionGroupSelector
          currentGroupId={session.playerGroup?.id ?? null}
          sessionId={sessionId}
        />
        <button
          aria-label="Partager"
          className="ml-auto rounded-lg p-1 text-text-secondary lg:p-2"
          onClick={() => setShareModalOpen(true)}
          type="button"
        >
          <QrCode size={20} />
        </button>
        <button
          aria-label="Modifier les joueurs"
          className="rounded-lg p-1 text-text-secondary disabled:opacity-40 lg:p-2"
          disabled={!!inProgressGame}
          onClick={() => setSwapModalOpen(true)}
          type="button"
        >
          <ArrowLeftRight size={20} />
        </button>
      </div>

      <Scoreboard
        addStarPending={addStar.isPending}
        cumulativeScores={session.cumulativeScores}
        currentDealerId={session.currentDealer?.id ?? null}
        onAddStar={(playerId) => {
          setStarPlayerId(playerId);
          addStar.reset();
          setStarModalOpen(true);
        }}
        onDealerChange={() => setChangeDealerModalOpen(true)}
        players={session.players}
        starEvents={session.starEvents}
      />

      {inProgressGame && (
        <InProgressBanner
          game={inProgressGame}
          onCancel={() => setDeleteModalOpen(true)}
          onComplete={() => setCompleteModalOpen(true)}
        />
      )}

      {completedGames.length >= 2 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-text-secondary">
            Évolution des scores
          </h2>
          <ScoreEvolutionChart
            games={completedGames}
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
          hasNextPage={hasNextPage ?? false}
          isFetchingNextPage={isFetchingNextPage}
          onDeleteLast={() => setDeleteModalOpen(true)}
          onEditLast={() => setEditModalOpen(true)}
          onLoadMore={() => fetchNextPage()}
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

      {undoGameId !== null && (
        <UndoFAB
          onDismiss={() => setUndoGameId(null)}
          onUndo={handleUndo}
        />
      )}

      <NewGameModal
        createGame={createGame}
        currentDealerName={session.currentDealer?.name ?? null}
        lastGameConfig={lastCompletedGame ? { contract: lastCompletedGame.contract, takerId: lastCompletedGame.taker.id } : undefined}
        onClose={() => setNewGameModalOpen(false)}
        open={newGameModalOpen}
        players={session.players}
      />

      {inProgressGame && (
        <CompleteGameModal
          game={inProgressGame}
          onClose={() => setCompleteModalOpen(false)}
          onGameCompleted={handleGameCompleted}
          onGameSaved={handleGameSaved}
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

      {lastGame && (
        <DeleteGameModal
          game={lastGame}
          onClose={() => setDeleteModalOpen(false)}
          open={deleteModalOpen}
          sessionId={sessionId}
        />
      )}

      <SwapPlayersModal
        currentPlayerIds={session.players.map((p) => p.id)}
        onClose={() => setSwapModalOpen(false)}
        onSwap={(newSession) => {
          if (newSession.id !== sessionId) {
            navigate(`/sessions/${newSession.id}`);
          } else {
            setSwapModalOpen(false);
          }
        }}
        open={swapModalOpen}
      />

      <AddStarModal
        errorMessage={addStar.error?.message}
        isError={addStar.isError}
        isPending={addStar.isPending}
        onClose={() => setStarModalOpen(false)}
        onConfirm={() => {
          if (starPlayerId !== null) {
            addStar.mutate(starPlayerId, {
              onSuccess: () => setStarModalOpen(false),
            });
          }
        }}
        open={starModalOpen}
        playerName={session.players.find((p) => p.id === starPlayerId)?.name ?? ""}
      />

      {session.currentDealer && (
        <ChangeDealerModal
          currentDealerId={session.currentDealer.id}
          isPending={updateDealer.isPending}
          onClose={() => setChangeDealerModalOpen(false)}
          onConfirm={(playerId) => {
            updateDealer.mutate(playerId, {
              onSuccess: () => setChangeDealerModalOpen(false),
            });
          }}
          open={changeDealerModalOpen}
          players={session.players}
        />
      )}

      <ShareQrCodeModal
        onClose={() => setShareModalOpen(false)}
        open={shareModalOpen}
        sessionId={sessionId}
      />

      <MemeOverlay ariaLabel={memeLabel} meme={activeMeme} onDismiss={() => { setActiveMeme(null); setMemeLabel(undefined); }} />
    </div>
  );
}
