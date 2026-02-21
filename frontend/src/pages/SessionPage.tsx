import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, ArrowUpDown, BarChart3, Lock, LockOpen, QrCode, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import NotFound from "./NotFound";
import AddStarModal from "../components/AddStarModal";
import BadgeUnlockedModal from "../components/BadgeUnlockedModal";
import ChangeDealerModal from "../components/ChangeDealerModal";
import ChangeGroupModal from "../components/ChangeGroupModal";
import CompleteGameModal from "../components/CompleteGameModal";
import DeleteGameModal from "../components/DeleteGameModal";
import GameList from "../components/GameList";
import InProgressBanner from "../components/InProgressBanner";
import MemeOverlay from "../components/MemeOverlay";
import NewGameModal from "../components/NewGameModal";
import ReorderPlayersModal from "../components/ReorderPlayersModal";
import Scoreboard from "../components/Scoreboard";
import ScoreEvolutionChart from "../components/ScoreEvolutionChart";
import ShareQrCodeModal from "../components/ShareQrCodeModal";
import SwapPlayersModal from "../components/SwapPlayersModal";
import { FAB, Modal, OverflowMenu, Spinner, UndoFAB } from "../components/ui";
import type { OverflowMenuItem } from "../components/ui/OverflowMenu";
import { useAddStar } from "../hooks/useAddStar";
import { useShake } from "../hooks/useShake";
import { useAllSessionGames } from "../hooks/useAllSessionGames";
import { useCloseSession } from "../hooks/useCloseSession";
import { useCreateGame } from "../hooks/useCreateGame";
import { usePlayerGroups } from "../hooks/usePlayerGroups";
import { useReorderPlayers } from "../hooks/useReorderPlayers";
import { useSession } from "../hooks/useSession";
import { useSessionGames } from "../hooks/useSessionGames";
import { useUpdateDealer } from "../hooks/useUpdateDealer";
import { useUpdateSessionGroup } from "../hooks/useUpdateSessionGroup";
import { useToast } from "../hooks/useToast";
import { apiFetch } from "../services/api";
import type { GameContext, MemeConfig } from "../services/memeSelector";
import { selectDefeatMeme, selectVictoryMeme } from "../services/memeSelector";
import type { Badge } from "../types/api";
import { GameStatus } from "../types/enums";
import { sortPlayersByOrder } from "../utils/playerOrder";

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
  const { data: allGames } = useAllSessionGames(sessionId);
  const addStar = useAddStar(sessionId);
  const closeSession = useCloseSession(sessionId);
  const createGame = useCreateGame(sessionId);
  const { groups } = usePlayerGroups();
  const reorderPlayers = useReorderPlayers(sessionId);
  const updateDealer = useUpdateDealer(sessionId);
  const updateGroup = useUpdateSessionGroup(sessionId);
  const { toast } = useToast();

  const inProgressGame = session?.inProgressGame ?? null;

  const completedGames = useMemo(
    () => gamesData?.pages.flatMap((p) => p.member) ?? [],
    [gamesData],
  );

  const lastCompletedGame = completedGames[0] ?? null;

  const lastGame = inProgressGame ?? lastCompletedGame;

  const orderedPlayers = useMemo(
    () => (session ? sortPlayersByOrder(session.players, session.playerOrder) : []),
    [session],
  );

  const queryClient = useQueryClient();
  const [activeMeme, setActiveMeme] = useState<MemeConfig | null>(null);
  const [badgeModalBadges, setBadgeModalBadges] = useState<Record<string, Badge[]> | null>(null);

  // Shake easter egg
  const [scoresFlipped, setScoresFlipped] = useState(false);
  const [shakeModalOpen, setShakeModalOpen] = useState(false);
  const shakeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleShake = useCallback(() => {
    if (scoresFlipped || shakeModalOpen) return;
    setScoresFlipped(true);
    shakeTimerRef.current = setTimeout(() => {
      setScoresFlipped(false);
      setShakeModalOpen(true);
      shakeTimerRef.current = null;
    }, 2000);
  }, [scoresFlipped, shakeModalOpen]);

  useEffect(() => {
    return () => {
      if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    };
  }, []);

  useShake(handleShake, { enabled: !scoresFlipped && !shakeModalOpen });
  const [changeDealerModalOpen, setChangeDealerModalOpen] = useState(false);
  const [changeGroupModalOpen, setChangeGroupModalOpen] = useState(false);
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [memeLabel, setMemeLabel] = useState<string | undefined>(undefined);
  const [newGameModalOpen, setNewGameModalOpen] = useState(false);
  const [reorderModalOpen, setReorderModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [starModalOpen, setStarModalOpen] = useState(false);
  const [starPlayerId, setStarPlayerId] = useState<number | null>(null);
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [undoGameId, setUndoGameId] = useState<number | null>(null);

  const overflowItems: OverflowMenuItem[] = useMemo(() => {
    const items: OverflowMenuItem[] = [
      { href: `/sessions/${sessionId}/summary`, icon: <BarChart3 size={18} />, label: "Récap de session" },
      { icon: <QrCode size={18} />, label: "Partager (QR)", onClick: () => setShareModalOpen(true) },
      { disabled: !!inProgressGame, icon: <ArrowLeftRight size={18} />, label: "Modifier les joueurs", onClick: () => setSwapModalOpen(true) },
    ];
    if (session?.isActive) {
      items.push({ disabled: !!inProgressGame, icon: <ArrowUpDown size={18} />, label: "Changer l'ordre", onClick: () => setReorderModalOpen(true) });
    }
    if (groups.length > 0) {
      items.push({ icon: <Users size={18} />, label: "Changer le groupe", onClick: () => setChangeGroupModalOpen(true) });
    }
    if (session?.isActive) {
      items.push({
        icon: <Lock size={18} />,
        label: "Terminer la session",
        onClick: () => setCloseConfirmOpen(true),
      });
    } else {
      items.push({ icon: <LockOpen size={18} />, label: "Réouvrir la session", onClick: () => closeSession.mutate(true, { onSuccess: () => toast("Session rouverte") }) });
    }
    return items;
  }, [closeSession, groups.length, inProgressGame, session?.isActive, sessionId, toast]);

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
      <div className="p-4"><Spinner /></div>
    );
  }

  if (!session) {
    return <NotFound />;
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
        <div className="ml-auto">
          <OverflowMenu
            items={overflowItems}
            label="Actions de session"
          />
        </div>
      </div>

      {!session.isActive && (
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          <Lock size={16} />
          <span className="text-sm font-medium">Session terminée</span>
        </div>
      )}

      <div className={`transition-transform duration-500 ${scoresFlipped ? "rotate-180" : ""}`}>
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
          players={orderedPlayers}
          starEvents={session.starEvents}
        />
      </div>

      {inProgressGame && (
        <InProgressBanner
          game={inProgressGame}
          onCancel={() => setDeleteModalOpen(true)}
          onComplete={() => setCompleteModalOpen(true)}
        />
      )}

      {allGames && allGames.filter((g) => g.status === GameStatus.Completed).length >= 2 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-text-secondary">
            Évolution des scores
          </h2>
          <ScoreEvolutionChart
            games={allGames}
            players={orderedPlayers}
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
          isSessionActive={session.isActive}
          onDeleteLast={() => setDeleteModalOpen(true)}
          onEditLast={() => setEditModalOpen(true)}
          onLoadMore={() => fetchNextPage()}
        />
      </div>

      {session.isActive && (
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
      )}

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
        players={orderedPlayers}
      />

      {inProgressGame && (
        <CompleteGameModal
          game={inProgressGame}
          onBadgesUnlocked={(badges) => setBadgeModalBadges(badges)}
          onClose={() => setCompleteModalOpen(false)}
          onGameCompleted={handleGameCompleted}
          onGameSaved={handleGameSaved}
          open={completeModalOpen}
          players={orderedPlayers}
          sessionId={sessionId}
        />
      )}

      {lastCompletedGame && (
        <CompleteGameModal
          game={lastCompletedGame}
          onClose={() => setEditModalOpen(false)}
          open={editModalOpen}
          players={orderedPlayers}
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
        currentPlayerIds={orderedPlayers.map((p) => p.id)}
        onClose={() => setSwapModalOpen(false)}
        onSwap={(newSession) => {
          setSwapModalOpen(false);
          if (newSession.id !== sessionId) {
            navigate(`/sessions/${newSession.id}`);
          }
        }}
        open={swapModalOpen}
      />

      <ReorderPlayersModal
        isPending={reorderPlayers.isPending}
        onClose={() => setReorderModalOpen(false)}
        onConfirm={(playerIds) => {
          reorderPlayers.mutate(playerIds, {
            onSuccess: () => {
              toast("Ordre des joueurs modifié");
              setReorderModalOpen(false);
            },
          });
        }}
        open={reorderModalOpen}
        players={orderedPlayers}
      />

      <AddStarModal
        errorMessage={addStar.error?.message}
        isError={addStar.isError}
        isPending={addStar.isPending}
        onClose={() => setStarModalOpen(false)}
        onConfirm={() => {
          if (starPlayerId !== null) {
            addStar.mutate(starPlayerId, {
              onSuccess: (data) => {
                toast("Étoile ajoutée");
                setStarModalOpen(false);
                if (data.newBadges && Object.keys(data.newBadges).length > 0) {
                  setBadgeModalBadges(data.newBadges);
                }
              },
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
              onSuccess: () => {
                toast("Donneur modifié");
                setChangeDealerModalOpen(false);
              },
            });
          }}
          open={changeDealerModalOpen}
          players={orderedPlayers}
        />
      )}

      <ChangeGroupModal
        currentGroupId={session.playerGroup?.id ?? null}
        groups={groups}
        isPending={updateGroup.isPending}
        onClose={() => setChangeGroupModalOpen(false)}
        onConfirm={(groupId) => {
          updateGroup.mutate(groupId, {
            onSuccess: () => {
              toast("Groupe modifié");
              setChangeGroupModalOpen(false);
            },
          });
        }}
        open={changeGroupModalOpen}
      />

      <Modal onClose={() => setCloseConfirmOpen(false)} open={closeConfirmOpen} title="Terminer la session">
        <p className="mb-4 text-sm text-text-secondary">
          Voulez-vous terminer cette session ? Vous pourrez la réouvrir plus tard.
        </p>
        <div className="flex gap-3">
          <button
            className="flex-1 rounded-xl bg-surface-secondary py-3 text-sm font-semibold text-text-secondary transition-colors"
            onClick={() => setCloseConfirmOpen(false)}
            type="button"
          >
            Annuler
          </button>
          <button
            className="flex-1 rounded-xl bg-accent-500 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-40"
            disabled={closeSession.isPending}
            onClick={() => {
              closeSession.mutate(false, {
                onSuccess: () => {
                  toast("Session terminée");
                  setCloseConfirmOpen(false);
                  navigate(`/sessions/${sessionId}/summary`);
                },
              });
            }}
            type="button"
          >
            Terminer
          </button>
        </div>
      </Modal>

      <ShareQrCodeModal
        onClose={() => setShareModalOpen(false)}
        open={shareModalOpen}
        sessionId={sessionId}
      />

      {badgeModalBadges && (
        <BadgeUnlockedModal
          newBadges={badgeModalBadges}
          onClose={() => setBadgeModalBadges(null)}
          open={badgeModalBadges !== null}
          players={orderedPlayers}
        />
      )}

      <MemeOverlay ariaLabel={memeLabel} meme={activeMeme} onDismiss={() => { setActiveMeme(null); setMemeLabel(undefined); }} />

      <Modal onClose={() => setShakeModalOpen(false)} open={shakeModalOpen} title="Eh non, bien essayé 😏">
        <div className="flex flex-col items-center gap-4">
          <img
            alt="Non non non"
            className="max-h-[40vh] rounded-xl"
            src="/easter-eggs/no-no-no.gif"
          />
        </div>
      </Modal>
    </div>
  );
}
