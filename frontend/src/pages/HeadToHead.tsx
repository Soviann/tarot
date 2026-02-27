import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DateRangeFilter from "../components/DateRangeFilter";
import GroupFilter from "../components/GroupFilter";
import { PlayerAvatar, Select, Spinner } from "../components/ui";
import { useHeadToHead } from "../hooks/useHeadToHead";
import { usePlayers } from "../hooks/usePlayers";
import type { HeadToHeadPlayerStats } from "../types/api";

function StatRow({ label, value1, value2 }: { label: string; value1: React.ReactNode; value2: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="flex-1 text-right text-sm font-semibold text-text-primary">{value1}</span>
      <span className="w-28 shrink-0 text-center text-xs text-text-muted">{label}</span>
      <span className="flex-1 text-left text-sm font-semibold text-text-primary">{value2}</span>
    </div>
  );
}

function WinRate({ games, wins }: { games: number; wins: number }) {
  if (0 === games) return <span>—</span>;
  return <span>{Math.round((wins / games) * 100)}%</span>;
}

function PlayerColumn({ player }: { player: HeadToHeadPlayerStats }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <PlayerAvatar color={player.playerColor} name={player.playerName} playerId={player.playerId} size="lg" />
      <span className="text-sm font-bold text-text-primary">{player.playerName}</span>
    </div>
  );
}

export default function HeadToHead() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [from, setFrom] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<number | null>(null);
  const [to, setTo] = useState<string | null>(null);

  const p1Param = searchParams.get("p1");
  const p2Param = searchParams.get("p2");
  const player1Id = p1Param ? Number(p1Param) : undefined;
  const player2Id = p2Param ? Number(p2Param) : undefined;

  const { players } = usePlayers();
  const enabled = player1Id !== undefined && player2Id !== undefined && player1Id !== player2Id;
  const { isFetching, stats } = useHeadToHead(player1Id, player2Id, groupId, from, to);

  const playerOptions = [
    { label: "Choisir…", value: "" },
    ...players
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((p) => ({ label: p.name, value: String(p.id) })),
  ];

  const setPlayer = (key: "p1" | "p2", value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <button
            aria-label="Retour"
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface-elevated"
            onClick={() => navigate("/stats")}
            type="button"
          >
            <svg className="size-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-text-primary">Comparaison face à face</h1>
        </div>
        <GroupFilter onChange={setGroupId} value={groupId} />
      </div>

      <DateRangeFilter
        from={from}
        onChange={(f, t) => { setFrom(f); setTo(t); }}
        to={to}
      />

      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-text-muted" htmlFor="h2h-p1">Joueur 1</label>
          <Select
            id="h2h-p1"
            onChange={(v) => setPlayer("p1", v)}
            options={playerOptions}
            value={p1Param ?? ""}
          />
        </div>
        <span className="pb-2 text-lg font-black text-text-muted">VS</span>
        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-text-muted" htmlFor="h2h-p2">Joueur 2</label>
          <Select
            id="h2h-p2"
            onChange={(v) => setPlayer("p2", v)}
            options={playerOptions}
            value={p2Param ?? ""}
          />
        </div>
      </div>

      {isFetching && (
        <div className="py-8">
          <Spinner />
        </div>
      )}

      {!isFetching && !stats && (
        <p className="py-8 text-center text-sm text-text-muted">
          {enabled ? "Aucune donnée disponible." : "Sélectionnez deux joueurs pour voir leur comparaison."}
        </p>
      )}

      {stats && (
        <div className="flex flex-col gap-6">
          {/* Player headers */}
          <div className="flex items-center justify-between">
            <PlayerColumn player={stats.player1} />
            <div className="flex flex-col items-center gap-1">
              <span className="rounded-full bg-accent-500 px-4 py-1.5 text-lg font-black text-white shadow">VS</span>
              <span className="text-xs text-text-muted">{stats.sharedSessions} session{stats.sharedSessions > 1 ? "s" : ""}</span>
              <span className="text-xs text-text-muted">{stats.sharedGames} donne{stats.sharedGames > 1 ? "s" : ""}</span>
            </div>
            <PlayerColumn player={stats.player2} />
          </div>

          {/* Stats comparison */}
          <div className="rounded-xl bg-surface-elevated p-4">
            <h2 className="mb-3 text-center text-sm font-semibold text-text-secondary">Statistiques globales</h2>
            <div className="divide-y divide-border">
              <StatRow label="Score total" value1={stats.player1.totalScore} value2={stats.player2.totalScore} />
              <StatRow label="Score moyen" value1={stats.player1.averageScore.toFixed(1)} value2={stats.player2.averageScore.toFixed(1)} />
            </div>
          </div>

          <div className="rounded-xl bg-surface-elevated p-4">
            <h2 className="mb-3 text-center text-sm font-semibold text-text-secondary">En tant que preneur</h2>
            <div className="divide-y divide-border">
              <StatRow label="Parties preneur" value1={stats.player1.gamesAsTaker} value2={stats.player2.gamesAsTaker} />
              <StatRow label="Victoires" value1={stats.player1.winsAsTaker} value2={stats.player2.winsAsTaker} />
              <StatRow
                label="Taux victoire"
                value1={<WinRate games={stats.player1.gamesAsTaker} wins={stats.player1.winsAsTaker} />}
                value2={<WinRate games={stats.player2.gamesAsTaker} wins={stats.player2.winsAsTaker} />}
              />
            </div>
          </div>

          <div className="rounded-xl bg-surface-elevated p-4">
            <h2 className="mb-3 text-center text-sm font-semibold text-text-secondary">Confrontations directes</h2>
            <p className="mb-2 text-center text-xs text-text-muted">Preneur vs défenseur adverse</p>
            <div className="divide-y divide-border">
              <StatRow label="Confrontations" value1={stats.player1.gamesAsTakerVsOtherAsDefender} value2={stats.player2.gamesAsTakerVsOtherAsDefender} />
              <StatRow label="Victoires" value1={stats.player1.winsAsTakerVsOtherAsDefender} value2={stats.player2.winsAsTakerVsOtherAsDefender} />
              <StatRow
                label="Taux victoire"
                value1={<WinRate games={stats.player1.gamesAsTakerVsOtherAsDefender} wins={stats.player1.winsAsTakerVsOtherAsDefender} />}
                value2={<WinRate games={stats.player2.gamesAsTakerVsOtherAsDefender} wins={stats.player2.winsAsTakerVsOtherAsDefender} />}
              />
            </div>
          </div>

          <div className="rounded-xl bg-surface-elevated p-4">
            <h2 className="mb-3 text-center text-sm font-semibold text-text-secondary">Partenariats</h2>
            <div className="divide-y divide-border">
              <StatRow label="Appelé l'autre" value1={stats.player1.calledOtherAsPartner} value2={stats.player2.calledOtherAsPartner} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
