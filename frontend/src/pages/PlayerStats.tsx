import { useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import BadgeGrid from "../components/BadgeGrid";
import ContractDistributionChart from "../components/ContractDistributionChart";
import EloEvolutionChart from "../components/EloEvolutionChart";
import GroupFilter from "../components/GroupFilter";
import PersonalRecords from "../components/PersonalRecords";
import ScoreTrendChart from "../components/ScoreTrendChart";
import { PlayerAvatar } from "../components/ui";
import { usePlayerStats } from "../hooks/usePlayerStats";
import { formatDuration } from "../utils/formatDuration";

export default function PlayerStats() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialGroupId = searchParams.get("group") ? Number(searchParams.get("group")) : null;
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(initialGroupId);
  const playerId = Number(id);
  const { isPending, stats } = usePlayerStats(playerId, selectedGroupId);

  if (isPending) {
    return (
      <div className="p-4 text-center text-text-muted">Chargement…</div>
    );
  }

  if (!stats) {
    return (
      <div className="p-4 text-center text-text-muted">
        Joueur introuvable
      </div>
    );
  }

  const rolesTotal = stats.gamesAsTaker + stats.gamesAsPartner + stats.gamesAsDefender;

  // Map PlayerContractEntry[] to ContractDistributionEntry[] for the shared chart
  const contractChartData = stats.contractDistribution.map((d) => ({
    contract: d.contract,
    count: d.count,
    percentage: stats.gamesAsTaker > 0
      ? Math.round((d.count / stats.gamesAsTaker) * 1000) / 10
      : 0,
  }));

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8">
      <div className="flex items-center gap-3">
        <button
          aria-label="Retour"
          className="rounded-lg p-1 text-text-secondary lg:p-2"
          onClick={() => navigate("/stats")}
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
        <PlayerAvatar color={stats.player.color} name={stats.player.name} playerId={stats.player.id} size="lg" />
        <h1 className="text-xl font-bold text-text-primary">{stats.player.name}</h1>
        <div className="ml-auto">
          <GroupFilter onChange={setSelectedGroupId} value={selectedGroupId} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard label="Donnes jouées" value={String(stats.gamesPlayed)} />
        <MetricCard label="Victoires (preneur)" value={`${stats.winRateAsTaker}%`} />
        <MetricCard label="Score moyen" value={String(stats.averageScore)} />
        <MetricCard label="ELO" value={String(stats.eloRating)} />
        <MetricCard label="Sessions" value={String(stats.sessionsPlayed)} />
        {stats.averageGameDurationSeconds !== null && (
          <MetricCard label="Durée moy. / donne" value={formatDuration(stats.averageGameDurationSeconds)} />
        )}
        {stats.totalPlayTimeSeconds > 0 && (
          <MetricCard label="Temps de jeu total" value={formatDuration(stats.totalPlayTimeSeconds)} />
        )}
      </div>

      {stats.totalStars > 0 && (
        <div className="flex gap-3">
          <div className="flex-1 rounded-xl bg-surface-elevated p-3 text-center">
            <span className="block text-lg font-bold text-yellow-400">
              {"★".repeat(Math.min(stats.totalStars, 10))}{stats.totalStars > 10 ? "…" : ""}
            </span>
            <span className="text-xs text-text-muted">
              {stats.totalStars} étoile{stats.totalStars > 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex-1 rounded-xl bg-surface-elevated p-3 text-center">
            <span className="block text-lg font-bold text-score-negative">
              {stats.starPenalties}
            </span>
            <span className="text-xs text-text-muted">
              Pénalité{stats.starPenalties > 1 ? "s" : ""}
            </span>
          </div>
        </div>
      )}

      {stats.playerGroups.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-text-secondary">Groupes</h2>
          <div className="flex flex-wrap gap-2">
            {stats.playerGroups.map((g) => (
              <Link
                key={g.id}
                to={`/groups/${g.id}`}
                className="rounded-full bg-surface-elevated px-3 py-1 text-sm font-medium text-accent-500 hover:bg-surface-tertiary dark:text-accent-300"
              >
                {g.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      <PersonalRecords records={stats.records} />

      <BadgeGrid badges={stats.badges} />

      {rolesTotal > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-text-secondary">
            Répartition des rôles
          </h2>
          <div className="flex h-4 overflow-hidden rounded-full">
            {stats.gamesAsTaker > 0 && (
              <div
                className="bg-accent-400"
                style={{ width: `${(stats.gamesAsTaker / rolesTotal) * 100}%` }}
                title={`Preneur: ${stats.gamesAsTaker}`}
              />
            )}
            {stats.gamesAsPartner > 0 && (
              <div
                className="bg-accent-200"
                style={{ width: `${(stats.gamesAsPartner / rolesTotal) * 100}%` }}
                title={`Partenaire: ${stats.gamesAsPartner}`}
              />
            )}
            {stats.gamesAsDefender > 0 && (
              <div
                className="bg-surface-tertiary"
                style={{ width: `${(stats.gamesAsDefender / rolesTotal) * 100}%` }}
                title={`Défenseur: ${stats.gamesAsDefender}`}
              />
            )}
          </div>
          <div className="mt-1 flex justify-between text-xs text-text-muted">
            <span>Preneur: {stats.gamesAsTaker}</span>
            <span>Partenaire: {stats.gamesAsPartner}</span>
            <span>Défenseur: {stats.gamesAsDefender}</span>
          </div>
        </section>
      )}

      {stats.contractDistribution.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-text-secondary">
            Contrats (preneur)
          </h2>
          <ContractDistributionChart data={contractChartData} />
        </section>
      )}

      {stats.recentScores.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-text-secondary">
            Évolution des scores récents
          </h2>
          <ScoreTrendChart data={stats.recentScores} />
        </section>
      )}

      {stats.eloHistory.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-text-secondary">
            Évolution ELO
          </h2>
          <EloEvolutionChart data={stats.eloHistory} />
        </section>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-elevated p-3 text-center">
      <span className="block text-lg font-bold text-text-primary">{value}</span>
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  );
}
