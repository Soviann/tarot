import { useNavigate } from "react-router-dom";
import ContractDistributionChart from "../components/ContractDistributionChart";
import EloRanking from "../components/EloRanking";
import Leaderboard from "../components/Leaderboard";
import { useGlobalStats } from "../hooks/useGlobalStats";

export default function Stats() {
  const navigate = useNavigate();
  const { isPending, stats } = useGlobalStats();

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
    <div className="flex flex-col gap-6 p-4">
      <h1 className="text-2xl font-bold text-text-primary">Statistiques</h1>

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

      <section>
        <h2 className="mb-2 text-sm font-semibold text-text-secondary">
          Classement
        </h2>
        <Leaderboard
          entries={stats.leaderboard}
          onPlayerClick={(id) => navigate(`/stats/player/${id}`)}
        />
      </section>

      {stats.eloRanking.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-semibold text-text-secondary">
            Classement ELO
          </h2>
          <EloRanking
            entries={stats.eloRanking}
            onPlayerClick={(id) => navigate(`/stats/player/${id}`)}
          />
        </section>
      )}

      <section>
        <h2 className="mb-2 text-sm font-semibold text-text-secondary">
          Répartition des contrats
        </h2>
        <ContractDistributionChart data={stats.contractDistribution} />
      </section>
    </div>
  );
}
