import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ContractDistributionChart from "../components/ContractDistributionChart";
import ContractSuccessRateTable from "../components/ContractSuccessRateTable";
import EloRanking from "../components/EloRanking";
import GlobalEloEvolutionChart from "../components/GlobalEloEvolutionChart";
import GroupFilter from "../components/GroupFilter";
import Leaderboard from "../components/Leaderboard";
import { useGlobalStats } from "../hooks/useGlobalStats";
import { formatDuration } from "../utils/formatDuration";

export default function Stats() {
  const navigate = useNavigate();
  const [groupId, setGroupId] = useState<number | null>(null);
  const { isPending, stats } = useGlobalStats(groupId);

  if (isPending) {
    return (
      <div className="p-4 text-center text-text-muted">Chargement…</div>
    );
  }

  if (!stats) {
    return (
      <div className="p-4 text-center text-text-muted">
        Impossible de charger les statistiques
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-4 lg:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Statistiques</h1>
        <GroupFilter onChange={setGroupId} value={groupId} />
      </div>

      <div className="flex gap-4">
        <div className="flex-1 rounded-xl bg-surface-elevated p-3 text-center">
          <span className="block text-2xl font-bold text-text-primary">
            {stats.totalGames}
          </span>
          <span className="text-xs text-text-muted">Donnes</span>
        </div>
        <div className="flex-1 rounded-xl bg-surface-elevated p-3 text-center">
          <span className="block text-2xl font-bold text-text-primary">
            {stats.totalSessions}
          </span>
          <span className="text-xs text-text-muted">Sessions</span>
        </div>
        {stats.totalStars > 0 && (
          <div className="flex-1 rounded-xl bg-surface-elevated p-3 text-center">
            <span className="block text-2xl font-bold text-yellow-400">
              {stats.totalStars}
            </span>
            <span className="text-xs text-text-muted">Étoiles</span>
          </div>
        )}
      </div>

      {stats.averageGameDuration !== null && (
        <div className="flex gap-4">
          <div className="flex-1 rounded-xl bg-surface-elevated p-3 text-center">
            <span className="block text-2xl font-bold text-text-primary">
              {formatDuration(stats.averageGameDuration)}
            </span>
            <span className="text-xs text-text-muted">Durée moy. / donne</span>
          </div>
          <div className="flex-1 rounded-xl bg-surface-elevated p-3 text-center">
            <span className="block text-2xl font-bold text-text-primary">
              {formatDuration(stats.totalPlayTime)}
            </span>
            <span className="text-xs text-text-muted">Temps de jeu total</span>
          </div>
        </div>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-text-secondary">
          Classement
        </h2>
        <Leaderboard
          entries={stats.leaderboard}
          onPlayerClick={(id) => navigate(`/stats/player/${id}${groupId ? `?group=${groupId}` : ""}`)}
        />
      </section>

      {stats.eloRanking.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-text-secondary">
            Classement ELO
          </h2>
          <EloRanking
            entries={stats.eloRanking}
            onPlayerClick={(id) => navigate(`/stats/player/${id}${groupId ? `?group=${groupId}` : ""}`)}
          />
        </section>
      )}

      {stats.eloEvolution.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-text-secondary">
            Évolution ELO
          </h2>
          <GlobalEloEvolutionChart data={stats.eloEvolution} />
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-text-secondary">
          Répartition des contrats
        </h2>
        <ContractDistributionChart data={stats.contractDistribution} />
      </section>

      {stats.contractSuccessRateByPlayer.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-text-secondary">
            Taux de réussite par contrat
          </h2>
          <ContractSuccessRateTable data={stats.contractSuccessRateByPlayer} />
        </section>
      )}
    </div>
  );
}
