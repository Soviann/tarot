import { useMemo } from "react";
import { useTheme } from "next-themes";
import { getThemeConfig } from "../services/themeRegistry";
import type { CumulativeScore, GamePlayer, StarEvent } from "../types/api";
import { PlayerAvatar, ScoreDisplay } from "./ui";

// ♠ Pique, ♣ Trèfle, ♥ Coeur, ♦ Carreau (poids 2 chacun) + 🃏 Joker (poids 1)
// → ~22% par couleur, ~11% pour le joker
const SUITS: { path: string; weight: number }[] = [
  { path: "M12 2c0 0-7 6-7 10a4 4 0 003.5 4c1.2 0 2.3-.6 3-1.5L11 20h2l-.5-5.5c.7.9 1.8 1.5 3 1.5a4 4 0 003.5-4c0-4-7-10-7-10z", weight: 2 },
  { path: "M12 3a3.5 3.5 0 00-3.5 3.5c0 .4.1.8.2 1.2A3.5 3.5 0 005 11a3.5 3.5 0 003.5 3.5c.8 0 1.5-.2 2.1-.6L10 20h4l-.6-6.1c.6.4 1.3.6 2.1.6A3.5 3.5 0 0019 11a3.5 3.5 0 00-3.7-3.3c.1-.4.2-.8.2-1.2A3.5 3.5 0 0012 3z", weight: 2 },
  { path: "M12 21s-7-5.5-7-10.5C5 7.46 7.46 5 9.5 5c1.54 0 3.04.99 3.57 2.36h-2.14C11.46 5.99 12.96 5 14.5 5 16.54 5 19 7.46 19 10.5c0 5-7 10.5-7 10.5z", weight: 2 },
  { path: "M12 3L5 12l7 9 7-9z", weight: 2 },
  { path: "M12 2a3 3 0 00-3 3c0 1.1.6 2 1.5 2.6-.9.3-1.5 1.2-1.5 2.2 0 1 .6 1.8 1.4 2.1C9.5 12.5 9 13.6 9 15c0 2.2 1.3 4 3 4s3-1.8 3-4c0-1.4-.5-2.5-1.4-3.1.8-.3 1.4-1.1 1.4-2.1 0-1-.6-1.9-1.5-2.2C14.4 7 15 6.1 15 5a3 3 0 00-3-3z", weight: 1 },
];

const TOTAL_WEIGHT = SUITS.reduce((sum, s) => sum + s.weight, 0);

function pickRandomSuit(): string {
  let r = Math.random() * TOTAL_WEIGHT;
  for (const suit of SUITS) {
    r -= suit.weight;
    if (r <= 0) return suit.path;
  }
  return SUITS[0].path;
}

const STARS_PER_PENALTY = 3;

interface ScoreboardProps {
  addStarPending?: boolean;
  cumulativeScores: CumulativeScore[];
  currentDealerId?: number | null;
  isScoreInverted?: boolean;
  onAddStar?: (playerId: number) => void;
  onDealerChange?: () => void;
  players: GamePlayer[];
  starEvents?: StarEvent[];
}

export default function Scoreboard({
  addStarPending = false,
  cumulativeScores,
  currentDealerId,
  isScoreInverted = false,
  onAddStar,
  onDealerChange,
  players,
  starEvents = [],
}: ScoreboardProps) {
  const { resolvedTheme } = useTheme();
  const themeConfig = getThemeConfig(resolvedTheme);

  const scoreMap = useMemo(
    () => new Map(cumulativeScores.map((s) => [s.playerId, s.score])),
    [cumulativeScores],
  );

  const starCountMap = useMemo(() => {
    const map = new Map<number, number>();
    for (const event of starEvents) {
      map.set(event.player.id, (map.get(event.player.id) ?? 0) + 1);
    }
    return map;
  }, [starEvents]);

  const displayScoreMap = useMemo(() => {
    if (!isScoreInverted) return scoreMap;
    const negated = new Map<number, number>();
    for (const [id, score] of scoreMap) {
      negated.set(id, -score);
    }
    return negated;
  }, [isScoreInverted, scoreMap]);

  // Nouveau tirage aléatoire uniquement quand le donneur change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const suitPath = useMemo(() => pickRandomSuit(), [currentDealerId]);

  return (
    <div className="relative">
      {isScoreInverted && (
        <div className="absolute -top-5 right-0 flex items-center gap-1 text-xs text-text-muted" title="Classement inversé">
          <svg className="size-3 animate-spin" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path d="M4 4v5h5M20 20v-5h-5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M20.49 9A9 9 0 0 0 5.64 5.64L4 4m16 16-1.64-1.64A9 9 0 0 1 3.51 15" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
        <div className="flex gap-2 lg:justify-center lg:gap-6">
          {players.map((player) => {
            const totalStars = starCountMap.get(player.id) ?? 0;
            const currentStars = totalStars % STARS_PER_PENALTY;

            return (
              <div
                className="flex min-w-0 flex-1 flex-col items-center gap-1 lg:min-w-24 lg:flex-initial"
                key={player.id}
              >
                <div className="relative">
                  <PlayerAvatar color={player.color} name={player.name} playerId={player.id} size="sm" />
                  {currentDealerId === player.id &&
                    (onDealerChange ? (
                      <button
                        aria-label="Changer le donneur"
                        className="absolute -bottom-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-accent-500 text-white shadow-sm"
                        onClick={onDealerChange}
                        type="button"
                      >
                        {themeConfig ? (
                          <img alt="" className="size-5 rounded-full" src={themeConfig.dealerIcon} />
                        ) : (
                          <svg className="size-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d={suitPath} />
                          </svg>
                        )}
                      </button>
                    ) : (
                      <span
                        className="absolute -bottom-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-accent-500 text-white shadow-sm"
                        title="Donneur"
                      >
                        {themeConfig ? (
                          <img alt="" className="size-5 rounded-full" src={themeConfig.dealerIcon} />
                        ) : (
                          <svg className="size-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d={suitPath} />
                          </svg>
                        )}
                      </span>
                    ))}
                </div>
                <span className="max-w-full truncate text-xs text-text-secondary lg:max-w-24 lg:text-sm">
                  {player.name}
                </span>
                <ScoreDisplay value={displayScoreMap.get(player.id) ?? 0} />
                {onAddStar && (
                  <button
                    aria-label={`Ajouter une étoile à ${player.name}`}
                    className="flex min-h-10 min-w-10 items-center justify-center gap-0.5 rounded-md px-1 py-0.5 text-xs transition-colors hover:bg-surface-tertiary disabled:opacity-50"
                    disabled={addStarPending}
                    onClick={() => onAddStar(player.id)}
                    type="button"
                  >
                    {Array.from({ length: STARS_PER_PENALTY }, (_, i) =>
                      themeConfig?.starIcons ? (
                        <img
                          alt=""
                          className={`size-3 ${i < currentStars ? "opacity-100" : "opacity-20"}`}
                          key={i}
                          src={themeConfig.starIcons[Math.floor(Math.random() * themeConfig.starIcons.length)]}
                        />
                      ) : (
                        <svg
                          className={`size-3 ${i < currentStars ? "text-yellow-400" : "text-text-muted/30"}`}
                          fill="currentColor"
                          key={i}
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ),
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
    </div>
  );
}
