import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCompleteGame } from "../hooks/useCompleteGame";
import type { GameContext } from "../services/memeSelector";
import { calculateScore, REQUIRED_POINTS } from "../services/scoreCalculator";
import type { Game, GamePlayer } from "../types/api";
import { Chelem, GameStatus, Poignee, Side } from "../types/enums";
import type { Chelem as ChelemType, Poignee as PoigneeType, Side as SideType } from "../types/enums";
import { ContractBadge, Modal, PlayerAvatar, ScoreDisplay, Stepper } from "./ui";

interface CompleteGameModalProps {
  game: Game;
  onClose: () => void;
  onGameCompleted?: (ctx: GameContext) => void;
  onGameSaved?: (gameId: number) => void;
  open: boolean;
  players: GamePlayer[];
  sessionId: number;
}

const poigneeOptions: { label: string; value: PoigneeType }[] = [
  { label: "Aucune", value: Poignee.None },
  { label: "Simple", value: Poignee.Simple },
  { label: "Double", value: Poignee.Double },
  { label: "Triple", value: Poignee.Triple },
];

const petitAuBoutOptions: { label: string; value: SideType }[] = [
  { label: "Aucun", value: Side.None },
  { label: "Attaque", value: Side.Attack },
  { label: "Défense", value: Side.Defense },
];

const chelemOptions: { label: string; value: ChelemType }[] = [
  { label: "Aucun", value: Chelem.None },
  { label: "Annoncé gagné", value: Chelem.AnnouncedWon },
  { label: "Annoncé perdu", value: Chelem.AnnouncedLost },
  { label: "Non annoncé gagné", value: Chelem.NotAnnouncedWon },
];

export default function CompleteGameModal({ game, onClose, onGameCompleted, onGameSaved, open, players, sessionId }: CompleteGameModalProps) {
  const completeGame = useCompleteGame(game.id, sessionId);
  const isEditMode = game.status === GameStatus.Completed;

  const [bonusesOpen, setBonusesOpen] = useState(false);
  const [chelem, setChelem] = useState<ChelemType>(Chelem.None);
  const [oudlers, setOudlers] = useState(0);
  const [partnerId, setPartnerId] = useState<number | null>(null);
  const [petitAuBout, setPetitAuBout] = useState<SideType>(Side.None);
  const [poignee, setPoignee] = useState<PoigneeType>(Poignee.None);
  const [poigneeOwner, setPoigneeOwner] = useState<SideType>(Side.None);
  const [points, setPoints] = useState("");
  const [selfCall, setSelfCall] = useState(false);

  useEffect(() => {
    if (!open) return;
    completeGame.reset();
    if (isEditMode) {
      setBonusesOpen(game.chelem !== Chelem.None || game.petitAuBout !== Side.None || game.poignee !== Poignee.None);
      setChelem(game.chelem);
      setOudlers(game.oudlers ?? 0);
      setPartnerId(game.partner?.id ?? null);
      setPetitAuBout(game.petitAuBout);
      setPoignee(game.poignee);
      setPoigneeOwner(game.poigneeOwner);
      setPoints(game.points !== null ? String(game.points) : "");
      setSelfCall(game.partner === null);
    } else {
      setBonusesOpen(false);
      setChelem(Chelem.None);
      setOudlers(0);
      setPartnerId(null);
      setPetitAuBout(Side.None);
      setPoignee(Poignee.None);
      setPoigneeOwner(Side.None);
      setPoints("");
      setSelfCall(false);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const pointsNum = points === "" ? null : Number(points);
  const pointsValid = pointsNum !== null && !isNaN(pointsNum) && pointsNum >= 0 && pointsNum <= 91;
  const hasPartner = selfCall || partnerId !== null;
  const canSubmit = pointsValid && hasPartner && !completeGame.isPending;

  const scoreResult = useMemo(() => {
    if (!pointsValid) return null;
    return calculateScore({
      chelem,
      contract: game.contract,
      oudlers,
      partnerId: selfCall ? null : partnerId,
      petitAuBout,
      poignee,
      points: pointsNum!,
    });
  }, [chelem, game.contract, oudlers, partnerId, petitAuBout, poignee, pointsNum, pointsValid, selfCall]);

  const otherPlayers = players.filter((p) => p.id !== game.taker.id);

  function handleSelfCall() {
    setSelfCall(true);
    setPartnerId(null);
  }

  function handleSelectPartner(id: number) {
    setSelfCall(false);
    setPartnerId(id);
  }

  function handleSubmit() {
    if (!canSubmit) return;
    completeGame.mutate(
      {
        chelem,
        oudlers,
        partnerId: selfCall ? null : partnerId,
        petitAuBout,
        poignee,
        poigneeOwner: poignee !== Poignee.None ? poigneeOwner : Side.None,
        points: pointsNum!,
        status: GameStatus.Completed,
      },
      {
        onSuccess: () => {
          if (!isEditMode && scoreResult) {
            onGameCompleted?.({
              attackWins: scoreResult.attackWins,
              chelem,
              contract: game.contract,
              isSelfCall: selfCall,
              oudlers,
              petitAuBout,
            });
            onGameSaved?.(game.id);
          }
          onClose();
        },
      },
    );
  }

  const title = isEditMode ? "Modifier la donne" : "Compléter la donne";

  return (
    <Modal onClose={onClose} open={open} title={title}>
      <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
        {/* Bandeau info preneur */}
        <div className="flex items-center gap-3 rounded-xl bg-surface-secondary p-3">
          <PlayerAvatar color={game.taker.color} name={game.taker.name} playerId={game.taker.id} size="md" />
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-text-primary">{game.taker.name}</span>
            <ContractBadge contract={game.contract} />
          </div>
        </div>

        {/* Partenaire */}
        <div>
          <h3 className="mb-2 text-sm font-medium text-text-secondary">Partenaire</h3>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              className={`rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                selfCall ? "ring-2 ring-accent-500 bg-accent-500/10 text-accent-500" : "bg-surface-secondary text-text-secondary"
              }`}
              onClick={handleSelfCall}
              type="button"
            >
              Seul
            </button>
            {otherPlayers.map((player) => (
              <button
                className={`rounded-full p-0.5 transition-all ${
                  partnerId === player.id ? "ring-2 ring-accent-500" : ""
                } ${selfCall ? "opacity-40" : ""}`}
                disabled={selfCall}
                key={player.id}
                onClick={() => handleSelectPartner(player.id)}
                type="button"
              >
                <PlayerAvatar color={player.color} name={player.name} playerId={player.id} size="md" />
              </button>
            ))}
          </div>
        </div>

        {/* Oudlers */}
        <div className="flex items-center justify-between">
          <Stepper label="Oudlers" max={3} min={0} onChange={setOudlers} value={oudlers} />
          <span className="text-sm text-text-muted">
            Requis : {REQUIRED_POINTS[oudlers]} pts
          </span>
        </div>

        {/* Points */}
        <div>
          <input
            className="w-full rounded-xl border border-surface-border bg-surface-primary px-4 py-3 text-center text-lg font-semibold tabular-nums text-text-primary placeholder:text-text-muted focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
            inputMode="numeric"
            onChange={(e) => setPoints(e.target.value)}
            pattern="[0-9]*"
            placeholder="Points"
            type="text"
            value={points}
          />
        </div>

        {/* Bonus (repliable) */}
        <div>
          <button
            className="flex w-full items-center justify-between rounded-xl bg-surface-secondary px-4 py-3 text-sm font-medium text-text-secondary"
            onClick={() => setBonusesOpen(!bonusesOpen)}
            type="button"
          >
            <span>Bonus (optionnel)</span>
            <ChevronDown className={`size-4 transition-transform ${bonusesOpen ? "rotate-180" : ""}`} />
          </button>

          {bonusesOpen && (
            <div className="mt-3 flex flex-col gap-4">
              {/* Poignée */}
              <div>
                <h4 className="mb-2 text-sm font-medium text-text-secondary">Poignée</h4>
                <div className="flex flex-wrap gap-2">
                  {poigneeOptions.map((opt) => (
                    <ToggleButton
                      key={opt.value}
                      label={opt.label}
                      onClick={() => {
                        setPoignee(opt.value);
                        if (opt.value === Poignee.None) setPoigneeOwner(Side.None);
                      }}
                      selected={poignee === opt.value}
                    />
                  ))}
                </div>
              </div>

              {/* Propriétaire poignée */}
              {poignee !== Poignee.None && (
                <div>
                  <h4 className="mb-2 text-sm font-medium text-text-secondary">Poignée montrée par</h4>
                  <div className="flex gap-2">
                    <ToggleButton
                      label="Attaque"
                      onClick={() => setPoigneeOwner(Side.Attack)}
                      selected={poigneeOwner === Side.Attack}
                    />
                    <ToggleButton
                      label="Défense"
                      onClick={() => setPoigneeOwner(Side.Defense)}
                      selected={poigneeOwner === Side.Defense}
                    />
                  </div>
                </div>
              )}

              {/* Petit au bout */}
              <div>
                <h4 className="mb-2 text-sm font-medium text-text-secondary">Petit au bout</h4>
                <div className="flex flex-wrap gap-2">
                  {petitAuBoutOptions.map((opt) => (
                    <ToggleButton
                      key={opt.value}
                      label={opt.label}
                      onClick={() => setPetitAuBout(opt.value)}
                      selected={petitAuBout === opt.value}
                    />
                  ))}
                </div>
              </div>

              {/* Chelem */}
              <div>
                <h4 className="mb-2 text-sm font-medium text-text-secondary">Chelem</h4>
                <div className="flex flex-wrap gap-2">
                  {chelemOptions.map((opt) => (
                    <ToggleButton
                      key={opt.value}
                      label={opt.label}
                      onClick={() => setChelem(opt.value)}
                      selected={chelem === opt.value}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Aperçu des scores */}
        {scoreResult && (
          <div className="rounded-xl bg-surface-secondary p-3">
            <p className={`mb-2 text-center text-sm font-semibold ${scoreResult.attackWins ? "text-score-positive" : "text-score-negative"}`}>
              {scoreResult.attackWins ? "Contrat rempli \u2713" : "Contrat chuté \u2717"}
            </p>
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">Preneur</span>
                <ScoreDisplay animated={false} value={scoreResult.takerScore} />
              </div>
              {!selfCall && partnerId !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-text-secondary">Partenaire</span>
                  <ScoreDisplay animated={false} value={scoreResult.partnerScore} />
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-text-secondary">
                  Défense ({selfCall ? "\u00d74" : "\u00d73"})
                </span>
                <ScoreDisplay animated={false} value={scoreResult.defenderScore} />
              </div>
            </div>
          </div>
        )}

        {/* Erreur */}
        {completeGame.isError && (
          <p className="text-center text-sm text-score-negative">
            {completeGame.error?.message ?? "Erreur inconnue"}
          </p>
        )}

        {/* Valider */}
        <button
          className="w-full rounded-xl bg-accent-500 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-40"
          disabled={!canSubmit}
          onClick={handleSubmit}
          type="button"
        >
          Valider
        </button>
      </div>
    </Modal>
  );
}

function ToggleButton({ label, onClick, selected }: { label: string; onClick: () => void; selected: boolean }) {
  return (
    <button
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
        selected
          ? "bg-accent-500 text-white"
          : "bg-surface-tertiary text-text-secondary"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}
