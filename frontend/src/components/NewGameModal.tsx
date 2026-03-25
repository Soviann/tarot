import { ChevronDown, RotateCcw } from "lucide-react";
import { useRef, useMemo, useState } from "react";
import type { useCreateGame } from "../hooks/useCreateGame";
import { useResetOnOpen } from "../hooks/useResetOnOpen";
import { apiFetch } from "../services/api";
import type { GameContext } from "../services/memeSelector";
import { calculateScore, REQUIRED_POINTS } from "../services/scoreCalculator";
import { toast } from "sonner";
import type { Badge, Game, GamePlayer } from "../types/api";
import { Chelem, GameStatus, Poignee, Side } from "../types/enums";
import { Contract } from "../types/enums";
import type { Chelem as ChelemType, Contract as ContractType, Poignee as PoigneeType, Side as SideType } from "../types/enums";
import { Modal, PlayerAvatar, ScoreDisplay, Stepper } from "./ui";

interface NewGameModalProps {
  createGame: ReturnType<typeof useCreateGame>;
  currentDealerName?: string | null;
  lastGameConfig?: { contract: ContractType; takerId: number };
  onBadgesUnlocked?: (newBadges: Record<string, Badge[]>) => void;
  onClose: () => void;
  onGameCompleted?: (ctx: GameContext) => void;
  onGameSaved?: (gameId: number) => void;
  open: boolean;
  players: GamePlayer[];
  sessionId?: number;
}

const contracts: { colorClass: string; label: string; value: ContractType }[] = [
  { colorClass: "bg-contract-petite", label: "Petite", value: Contract.Petite },
  { colorClass: "bg-contract-garde", label: "Garde", value: Contract.Garde },
  { colorClass: "bg-contract-garde-sans", label: "Garde Sans", value: Contract.GardeSans },
  { colorClass: "bg-contract-garde-contre", label: "Garde Contre", value: Contract.GardeContre },
];

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

export default function NewGameModal({ createGame, currentDealerName, lastGameConfig, onBadgesUnlocked, onClose, onGameCompleted, onGameSaved, open, players, sessionId }: NewGameModalProps) {
  const [selectedContract, setSelectedContract] = useState<ContractType | null>(null);
  const [selectedTakerId, setSelectedTakerId] = useState<number | null>(null);

  // Completion state
  const completionRef = useRef<HTMLDivElement>(null);
  const [completionOpen, setCompletionOpen] = useState(false);
  const [bonusesOpen, setBonusesOpen] = useState(false);
  const [chelem, setChelem] = useState<ChelemType>(Chelem.None);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oudlers, setOudlers] = useState(0);
  const [partnerId, setPartnerId] = useState<number | null>(null);
  const [petitAuBout, setPetitAuBout] = useState<SideType>(Side.None);
  const [poignee, setPoignee] = useState<PoigneeType>(Poignee.None);
  const [poigneeOwner, setPoigneeOwner] = useState<SideType>(Side.None);
  const [points, setPoints] = useState("");
  const [pointsSide, setPointsSide] = useState<"attack" | "defense">("attack");
  const [selfCall, setSelfCall] = useState(false);

  useResetOnOpen(open, () => {
    setSelectedContract(null);
    setSelectedTakerId(null);
    setCompletionOpen(false);
    setBonusesOpen(false);
    setChelem(Chelem.None);
    setIsSubmitting(false);
    setOudlers(0);
    setPartnerId(null);
    setPetitAuBout(Side.None);
    setPoignee(Poignee.None);
    setPoigneeOwner(Side.None);
    setPoints("");
    setPointsSide("attack");
    setSelfCall(false);
    createGame.reset();
  });

  const pointsNum = points === "" ? null : Number(points.replace(",", "."));
  const pointsValid = pointsNum !== null && !isNaN(pointsNum) && pointsNum >= 0 && pointsNum <= 91 && (pointsNum % 1 === 0 || pointsNum % 1 === 0.5);
  const attackPoints = pointsValid && pointsNum !== null ? (pointsSide === "defense" ? 91 - pointsNum : pointsNum) : null;
  const hasPartner = selfCall || partnerId !== null;
  const completionIntended = points !== "";
  const completionValid = pointsValid && hasPartner;

  const canSubmit = selectedTakerId !== null
    && selectedContract !== null
    && !createGame.isPending
    && !isSubmitting
    && (!completionIntended || completionValid);

  const otherPlayers = players.filter((p) => p.id !== selectedTakerId);

  const scoreResult = useMemo(() => {
    if (!pointsValid || !selectedContract || attackPoints === null) return null;
    return calculateScore({
      chelem,
      contract: selectedContract,
      oudlers,
      partnerId: selfCall ? null : partnerId,
      petitAuBout,
      poignee,
      points: attackPoints,
    });
  }, [attackPoints, chelem, selectedContract, oudlers, partnerId, petitAuBout, poignee, pointsValid, selfCall]);

  async function completeCreatedGame(game: Game) {
    if (!completionIntended || !completionValid || !sessionId) return;

    setIsSubmitting(true);
    try {
      const completed = await apiFetch<Game>(`/games/${game.id}`, {
        body: JSON.stringify({
          chelem,
          oudlers,
          partner: selfCall || partnerId === null ? null : `/api/players/${partnerId}`,
          petitAuBout,
          poignee,
          poigneeOwner: poignee !== Poignee.None ? poigneeOwner : Side.None,
          points: attackPoints!,
          status: GameStatus.Completed,
        }),
        headers: { "Content-Type": "application/merge-patch+json" },
        method: "PATCH",
      });

      toast("Donne enregistrée");
      if (scoreResult) {
        onGameCompleted?.({
          attackWins: scoreResult.attackWins,
          chelem,
          consecutiveLosses: 0,
          contract: selectedContract!,
          isSelfCall: selfCall,
          oudlers,
          petitAuBout,
          points: attackPoints!,
          previousScore: null,
          takerScore: scoreResult.takerScore,
        });
        onGameSaved?.(game.id);
      }
      if (completed.newBadges && Object.keys(completed.newBadges).length > 0) {
        onBadgesUnlocked?.(completed.newBadges);
      }
      onClose();
    } catch {
      toast.warning("Donne créée mais non complétée");
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSubmit() {
    if (!canSubmit) return;
    createGame.mutate(
      { contract: selectedContract, takerId: selectedTakerId },
      {
        onSuccess: (game) => {
          if (completionIntended && completionValid) {
            completeCreatedGame(game);
          } else {
            toast("Donne créée");
            onClose();
          }
        },
      },
    );
  }

  return (
    <Modal onClose={onClose} open={open} title="Nouvelle donne">
      <div className="flex max-h-[70vh] flex-col gap-4">
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto">
        {/* Donneur */}
        {currentDealerName && (
          <p className="text-center text-sm text-text-secondary">
            Donneur : <span className="font-medium text-text-primary">{currentDealerName}</span>
          </p>
        )}

        {/* Même config */}
        {lastGameConfig && (
          <div className="flex justify-center">
            <button
              className="inline-flex items-center gap-1.5 rounded-lg border border-accent-500 px-3 py-1.5 text-xs font-medium text-accent-500 transition-colors hover:bg-accent-500/10 dark:border-accent-300 dark:text-accent-300"
              onClick={() => {
                setSelectedContract(lastGameConfig.contract);
                setSelectedTakerId(lastGameConfig.takerId);
              }}
              type="button"
            >
              <RotateCcw size={14} />
              Même config
            </button>
          </div>
        )}

        {/* Preneur */}
        <div>
          <h3 className="mb-2 text-sm font-medium text-text-secondary">Preneur</h3>
          <div className="flex justify-center gap-3">
            {players.map((player) => (
              <button
                className={`rounded-full p-0.5 transition-all ${
                  selectedTakerId === player.id ? "ring-2 ring-accent-500" : ""
                }`}
                key={player.id}
                onClick={() => setSelectedTakerId(player.id)}
                type="button"
              >
                <PlayerAvatar color={player.color} name={player.name} playerId={player.id} size="lg" />
              </button>
            ))}
          </div>
          {selectedTakerId && (
            <p className="mt-1 text-center text-sm text-text-secondary">
              {players.find((p) => p.id === selectedTakerId)?.name}
            </p>
          )}
        </div>

        {/* Contrat */}
        <div>
          <h3 className="mb-2 text-sm font-medium text-text-secondary">Contrat</h3>
          <div className="grid grid-cols-2 gap-2">
            {contracts.map(({ colorClass, label, value }) => (
              <button
                className={`${colorClass} rounded-xl px-4 py-3 text-sm font-semibold text-white transition-all ${
                  selectedContract === value ? "ring-3 ring-offset-2 ring-offset-surface-primary ring-white scale-105 shadow-lg" : selectedContract !== null ? "opacity-50" : "opacity-80"
                }`}
                key={value}
                onClick={() => setSelectedContract(value)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Résultat (optionnel) — accordéon de complétion */}
        <div>
          <button
            className="flex w-full items-center justify-between rounded-xl bg-surface-secondary px-4 py-3 text-sm font-medium text-text-secondary"
            aria-expanded={completionOpen}
            onClick={() => {
              const opening = !completionOpen;
              setCompletionOpen(opening);
              if (opening) {
                requestAnimationFrame(() => {
                  completionRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
                });
              }
            }}
            type="button"
          >
            <span>Résultat (optionnel)</span>
            <ChevronDown className={`size-4 transition-transform ${completionOpen ? "rotate-180" : ""}`} />
          </button>

          {completionOpen && (
            <div ref={completionRef} className="mt-3 flex flex-col gap-4">
              {/* Partenaire */}
              <div>
                <h3 className="mb-2 text-sm font-medium text-text-secondary">Partenaire</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    className={`rounded-xl px-3 py-2 text-sm font-medium transition-all ${
                      selfCall ? "ring-2 ring-accent-500 bg-accent-500/10 text-accent-500 dark:text-accent-300 dark:ring-accent-300" : "bg-surface-secondary text-text-secondary"
                    }`}
                    onClick={() => { setSelfCall(true); setPartnerId(null); }}
                    type="button"
                  >
                    Seul
                  </button>
                  {otherPlayers.map((player) => (
                    <button
                      className={`rounded-full p-0.5 transition-all ${
                        partnerId === player.id && !selfCall ? "ring-2 ring-accent-500" : ""
                      } ${selfCall ? "opacity-40" : ""}`}
                      key={player.id}
                      onClick={() => { setSelfCall(false); setPartnerId(player.id); }}
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
              <div className="flex gap-2">
                <div className="flex flex-col gap-1">
                  <ToggleButton label="Att." onClick={() => setPointsSide("attack")} selected={pointsSide === "attack"} />
                  <ToggleButton label="Déf." onClick={() => setPointsSide("defense")} selected={pointsSide === "defense"} />
                </div>
                <input
                  className="min-w-0 flex-1 rounded-xl border border-surface-border bg-surface-primary px-4 py-3 text-center text-lg font-semibold tabular-nums text-text-primary placeholder:text-text-muted focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
                  inputMode="decimal"
                  onChange={(e) => setPoints(e.target.value)}
                  placeholder="Points"
                  type="text"
                  value={points}
                />
              </div>

              {/* Bonus (repliable) */}
              <div>
                <button
                  className="flex w-full items-center justify-between rounded-xl bg-surface-secondary px-4 py-3 text-sm font-medium text-text-secondary"
                  aria-expanded={bonusesOpen}
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
                          <ToggleButton label="Attaque" onClick={() => setPoigneeOwner(Side.Attack)} selected={poigneeOwner === Side.Attack} />
                          <ToggleButton label="Défense" onClick={() => setPoigneeOwner(Side.Defense)} selected={poigneeOwner === Side.Defense} />
                        </div>
                      </div>
                    )}

                    {/* Petit au bout */}
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-text-secondary">Petit au bout</h4>
                      <div className="flex flex-wrap gap-2">
                        {petitAuBoutOptions.map((opt) => (
                          <ToggleButton key={opt.value} label={opt.label} onClick={() => setPetitAuBout(opt.value)} selected={petitAuBout === opt.value} />
                        ))}
                      </div>
                    </div>

                    {/* Chelem */}
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-text-secondary">Chelem</h4>
                      <div className="flex flex-wrap gap-2">
                        {chelemOptions.map((opt) => (
                          <ToggleButton key={opt.value} label={opt.label} onClick={() => setChelem(opt.value)} selected={chelem === opt.value} />
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
                      <ScoreDisplay value={scoreResult.takerScore} />
                    </div>
                    {!selfCall && partnerId !== null && (
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary">Partenaire</span>
                        <ScoreDisplay value={scoreResult.partnerScore} />
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-text-secondary">
                        Défense ({selfCall ? "\u00d74" : "\u00d73"})
                      </span>
                      <ScoreDisplay value={scoreResult.defenderScore} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        </div>

        {/* Erreur */}
        {createGame.isError && (
          <p className="text-center text-sm text-score-negative">
            {createGame.error?.message ?? "Erreur inconnue"}
          </p>
        )}

        {/* Valider */}
        <button
          className="w-full shrink-0 rounded-xl bg-accent-500 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-40"
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
