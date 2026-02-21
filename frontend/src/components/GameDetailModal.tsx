import { REQUIRED_POINTS } from "../services/scoreCalculator";
import { useGame } from "../hooks/useGame";
import type { Game, ScoreEntry } from "../types/api";
import { ContractBadge, Modal, PlayerAvatar, ScoreDisplay, Spinner } from "./ui";

function formatScoreDiff(points: number, oudlers: number): string {
  const required = REQUIRED_POINTS[oudlers];
  const diff = Math.trunc(points) - required;
  return diff >= 0 ? `+${diff}` : `${diff}`;
}

function ScoreRow({ entry, role }: { entry: ScoreEntry; role?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <PlayerAvatar
          color={entry.player.color}
          name={entry.player.name}
          playerId={entry.player.id}
          size="sm"
        />
        <span className="text-sm text-text-primary">{entry.player.name}</span>
        {role && (
          <span className="rounded bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-blue-400">{role}</span>
        )}
      </div>
      <ScoreDisplay animated={false} className="text-sm" value={entry.score} />
    </div>
  );
}

function GameDetail({ game }: { game: Game }) {
  const takerEntry = game.scoreEntries.find((e) => e.player.id === game.taker.id);
  const partnerEntry = game.partner
    ? game.scoreEntries.find((e) => e.player.id === game.partner!.id)
    : null;
  const defenseEntries = game.scoreEntries.filter(
    (e) => e.player.id !== game.taker.id && e.player.id !== game.partner?.id,
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-2">
        <ContractBadge contract={game.contract} />
        {game.oudlers !== null && game.points !== null && (
          <span className="text-xs text-text-muted">
            {game.oudlers} {game.oudlers === 1 ? "bout" : "bouts"} · {formatScoreDiff(game.points, game.oudlers)}
          </span>
        )}
      </div>
      <div className="space-y-1">
        {takerEntry && <ScoreRow entry={takerEntry} role="Preneur" />}
        {partnerEntry && <ScoreRow entry={partnerEntry} role="Appelé" />}
        {defenseEntries.map((entry) => (
          <ScoreRow entry={entry} key={entry.id} />
        ))}
      </div>
    </div>
  );
}

interface Props {
  gameId: number | null;
  onClose: () => void;
  open: boolean;
}

export default function GameDetailModal({ gameId, onClose, open }: Props) {
  const { data: game, isPending } = useGame(open ? gameId : null);

  return (
    <Modal onClose={onClose} open={open} title="Détail de la donne">
      {isPending && <div className="flex justify-center py-4"><Spinner /></div>}
      {game && <GameDetail game={game} />}
    </Modal>
  );
}
