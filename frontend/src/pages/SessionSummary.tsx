import { ArrowLeft, Download, Share2 } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PlayerAvatar from "../components/ui/PlayerAvatar";
import ScoreDisplay from "../components/ui/ScoreDisplay";
import { useSessionSummary } from "../hooks/useSessionSummary";
import type {
  SessionAward,
  SessionHighlights,
  SessionRankingEntry,
} from "../types/api";
import { formatDuration } from "../utils/formatDuration";

const CONTRACT_LABELS: Record<string, string> = {
  garde: "Garde",
  garde_contre: "Garde Contre",
  garde_sans: "Garde Sans",
  petite: "Petite",
};

function formatContract(contract: string): string {
  return CONTRACT_LABELS[contract] ?? contract;
}

// --- Podium ---

function Podium({ ranking }: { ranking: SessionRankingEntry[] }) {
  if (ranking.length === 0) return null;

  const first = ranking[0];
  const second = ranking[1] ?? null;
  const third = ranking[2] ?? null;

  const medalColors = {
    bronze: "#CD7F32",
    gold: "#FFD700",
    silver: "#C0C0C0",
  };

  return (
    <div className="flex items-end justify-center gap-2 lg:gap-4">
      {/* 2nd place — left */}
      {second && (
        <div className="flex w-24 flex-col items-center lg:w-32">
          <span className="mb-1 text-2xl lg:text-3xl">🥈</span>
          <PlayerAvatar
            color={second.playerColor}
            name={second.playerName}
            playerId={second.playerId}
            size="md"
          />
          <span className="mt-1 text-sm font-medium text-text-primary lg:text-base">
            {second.playerName}
          </span>
          <ScoreDisplay animated={false} value={second.score} />
          <div
            className="mt-2 w-full rounded-t-lg"
            style={{
              backgroundColor: medalColors.silver,
              height: "4rem",
              opacity: 0.3,
            }}
          />
        </div>
      )}

      {/* 1st place — center */}
      <div className="flex w-28 flex-col items-center lg:w-36">
        <span className="mb-1 text-3xl lg:text-4xl">🥇</span>
        <PlayerAvatar
          color={first.playerColor}
          name={first.playerName}
          playerId={first.playerId}
          size="lg"
        />
        <span className="mt-1 font-semibold text-text-primary lg:text-lg">
          {first.playerName}
        </span>
        <ScoreDisplay animated={false} className="text-lg" value={first.score} />
        <div
          className="mt-2 w-full rounded-t-lg"
          style={{
            backgroundColor: medalColors.gold,
            height: "6rem",
            opacity: 0.3,
          }}
        />
      </div>

      {/* 3rd place — right */}
      {third && (
        <div className="flex w-24 flex-col items-center lg:w-32">
          <span className="mb-1 text-2xl lg:text-3xl">🥉</span>
          <PlayerAvatar
            color={third.playerColor}
            name={third.playerName}
            playerId={third.playerId}
            size="md"
          />
          <span className="mt-1 text-sm font-medium text-text-primary lg:text-base">
            {third.playerName}
          </span>
          <ScoreDisplay animated={false} value={third.score} />
          <div
            className="mt-2 w-full rounded-t-lg"
            style={{
              backgroundColor: medalColors.bronze,
              height: "3rem",
              opacity: 0.3,
            }}
          />
        </div>
      )}
    </div>
  );
}

// --- Full Ranking ---

function FullRanking({ ranking }: { ranking: SessionRankingEntry[] }) {
  if (ranking.length === 0) {
    return (
      <p className="text-center text-text-muted">Aucune donne enregistrée</p>
    );
  }

  return (
    <div className="rounded-xl bg-surface-secondary p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-text-primary lg:text-xl">
        Classement
      </h2>
      <div className="flex flex-col gap-2">
        {ranking.map((entry) => (
          <div
            className="flex items-center gap-3 rounded-lg px-2 py-1"
            key={entry.playerId}
          >
            <span className="w-6 text-center font-bold text-text-muted">
              {entry.position}
            </span>
            <PlayerAvatar
              color={entry.playerColor}
              name={entry.playerName}
              playerId={entry.playerId}
              size="sm"
            />
            <span className="flex-1 font-medium text-text-primary">
              {entry.playerName}
            </span>
            <ScoreDisplay animated={false} value={entry.score} />
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Highlights ---

interface HighlightCardProps {
  emoji: string;
  label: string;
  value: string;
}

function HighlightCard({ emoji, label, value }: HighlightCardProps) {
  return (
    <div className="rounded-xl bg-surface-secondary p-3 shadow-sm lg:p-4">
      <div className="mb-1 text-xl lg:text-2xl">{emoji}</div>
      <div className="text-xs font-medium text-text-muted lg:text-sm">
        {label}
      </div>
      <div className="text-sm font-semibold text-text-primary lg:text-base">
        {value}
      </div>
    </div>
  );
}

function Highlights({ highlights }: { highlights: SessionHighlights }) {
  const cards: HighlightCardProps[] = [];

  if (highlights.mvp) {
    cards.push({
      emoji: "🏆",
      label: "MVP",
      value: `${highlights.mvp.playerName} (${highlights.mvp.score > 0 ? "+" : ""}${highlights.mvp.score})`,
    });
  }

  if (highlights.lastPlace) {
    cards.push({
      emoji: "😢",
      label: "Lanterne rouge",
      value: `${highlights.lastPlace.playerName} (${highlights.lastPlace.score > 0 ? "+" : ""}${highlights.lastPlace.score})`,
    });
  }

  if (highlights.bestGame) {
    cards.push({
      emoji: "🎯",
      label: "Meilleure donne",
      value: `${highlights.bestGame.playerName} — ${formatContract(highlights.bestGame.contract)} (${highlights.bestGame.score > 0 ? "+" : ""}${highlights.bestGame.score})`,
    });
  }

  if (highlights.worstGame) {
    cards.push({
      emoji: "💀",
      label: "Pire donne",
      value: `${highlights.worstGame.playerName} — ${formatContract(highlights.worstGame.contract)} (${highlights.worstGame.score > 0 ? "+" : ""}${highlights.worstGame.score})`,
    });
  }

  if (highlights.mostPlayedContract) {
    cards.push({
      emoji: "📊",
      label: "Contrat favori",
      value: `${formatContract(highlights.mostPlayedContract.contract)} (${highlights.mostPlayedContract.count}x)`,
    });
  }

  cards.push({
    emoji: "⏱️",
    label: "Durée",
    value: formatDuration(highlights.duration),
  });

  cards.push({
    emoji: "🃏",
    label: "Donnes jouées",
    value: String(highlights.totalGames),
  });

  cards.push({
    emoji: "⭐",
    label: "Étoiles",
    value: String(highlights.totalStars),
  });

  return (
    <div className="rounded-xl bg-surface-secondary p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-text-primary lg:text-xl">
        Faits marquants
      </h2>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
        {cards.map((card) => (
          <HighlightCard
            emoji={card.emoji}
            key={card.label}
            label={card.label}
            value={card.value}
          />
        ))}
      </div>
    </div>
  );
}

// --- Awards ---

const AWARD_COLORS = [
  "border-l-amber-400",
  "border-l-blue-400",
  "border-l-emerald-400",
  "border-l-purple-400",
  "border-l-rose-400",
  "border-l-cyan-400",
];

function Awards({ awards }: { awards: SessionAward[] }) {
  if (awards.length === 0) return null;

  return (
    <div className="rounded-xl bg-surface-secondary p-4 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-text-primary lg:text-xl">
        Distinctions
      </h2>
      <div className="flex flex-col gap-2">
        {awards.map((award, index) => (
          <div
            className={`rounded-lg border-l-4 bg-surface-primary p-3 ${AWARD_COLORS[index % AWARD_COLORS.length]}`}
            key={`${award.playerId}-${award.title}`}
          >
            <div className="mb-1 font-bold text-text-primary">
              {award.title}
            </div>
            <div className="flex items-center gap-2">
              <PlayerAvatar
                color={award.playerColor}
                name={award.playerName}
                playerId={award.playerId}
                size="sm"
              />
              <span className="text-sm font-medium text-text-primary">
                {award.playerName}
              </span>
            </div>
            <div className="mt-1 text-sm text-text-secondary">
              {award.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main Page ---

export default function SessionSummary() {
  const { id } = useParams<{ id: string }>();
  const sessionId = Number(id);
  const { data: summary, isPending } = useSessionSummary(sessionId);
  const summaryRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = useCallback(async () => {
    if (!summaryRef.current) return;

    setIsSharing(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(summaryRef.current, { pixelRatio: 2 });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `recap-session-${sessionId}.png`, {
        type: "image/png",
      });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Récap Session #${sessionId}`,
        });
      } else {
        // Fallback: download
        const a = document.createElement("a");
        a.download = file.name;
        a.href = dataUrl;
        a.click();
      }
    } catch (error) {
      console.error("Échec du partage :", error);
    } finally {
      setIsSharing(false);
    }
  }, [sessionId]);

  if (isPending) {
    return (
      <div className="p-4 text-center text-text-muted">Chargement…</div>
    );
  }

  if (!summary) {
    return (
      <div className="p-4 text-center text-text-muted">
        Impossible de charger le récapitulatif
      </div>
    );
  }

  const hasGames = summary.highlights.totalGames > 0;

  return (
    <div className="flex flex-col gap-4 p-4 lg:gap-6 lg:p-8">
      {/* Header */}
      <header className="flex items-center gap-3">
        <Link
          className="rounded-lg p-2 text-text-secondary hover:bg-surface-secondary"
          to={`/sessions/${sessionId}`}
        >
          <ArrowLeft className="size-5 lg:size-6" />
        </Link>
        <h1 className="text-xl font-bold text-text-primary lg:text-2xl">
          Récap Session #{sessionId}
        </h1>
      </header>

      {/* Shareable zone */}
      <div
        className="flex flex-col gap-4 rounded-2xl bg-surface-primary p-4 lg:gap-6 lg:p-6"
        ref={summaryRef}
      >
        {/* Podium */}
        {hasGames && <Podium ranking={summary.ranking} />}

        {/* Full ranking */}
        <FullRanking ranking={summary.ranking} />

        {/* Highlights */}
        <Highlights highlights={summary.highlights} />

        {/* Awards */}
        <Awards awards={summary.awards} />
      </div>

      {/* Action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-primary/90 disabled:opacity-50"
          disabled={isSharing}
          onClick={handleShare}
          type="button"
        >
          {isSharing ? (
            <>
              <Download className="size-5 animate-pulse" />
              Génération…
            </>
          ) : (
            <>
              <Share2 className="size-5" />
              Partager
            </>
          )}
        </button>
        <Link
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-surface-secondary px-6 py-3 font-semibold text-text-primary transition-colors hover:bg-surface-secondary/80"
          to={`/sessions/${sessionId}`}
        >
          Retour à la session
        </Link>
      </div>
    </div>
  );
}
