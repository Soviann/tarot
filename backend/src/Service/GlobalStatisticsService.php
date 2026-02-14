<?php

declare(strict_types=1);

namespace App\Service;

use App\Enum\Contract;
use App\Enum\GameStatus;
use Doctrine\ORM\AbstractQuery;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Statistiques globales agrégées sur l'ensemble des joueurs et des donnes.
 *
 * Alimente la page « Statistiques » (route GET /api/statistics).
 * Chaque méthode accepte un $playerGroupId optionnel pour filtrer les résultats
 * sur un groupe de joueurs donné (jointure dynamique sur Session.playerGroup).
 *
 * Méthodes principales :
 * - getLeaderboard()             — classement général (score total, parties jouées, winRate)
 * - getContractDistribution()    — répartition des contrats joués (avec pourcentage)
 * - getContractSuccessRateByPlayer() — taux de réussite par contrat et par joueur
 * - getEloRanking()              — classement ELO courant
 * - getAllPlayersEloHistory()     — historique ELO complet (pour le graphique d'évolution)
 * - getAverageGameDurationSeconds() / getTotalPlayTimeSeconds() — métriques de durée
 * - getTotalGames() / getTotalSessions() / getTotalStars() — compteurs globaux
 */
class GlobalStatisticsService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
    ) {
    }

    /**
     * Taux de réussite par contrat pour chaque joueur.
     *
     * Exécute deux requêtes DQL :
     * 1. Nombre de fois où chaque joueur a pris chaque contrat.
     * 2. Nombre de victoires (score preneur > 0) par joueur et contrat.
     * Fusionne les résultats via une map playerId_contract → wins.
     *
     * @return list<array{color: string|null, contracts: list<array{contract: string, count: int, winRate: float, wins: int}>, id: int, name: string}>
     */
    public function getContractSuccessRateByPlayer(?int $playerGroupId = null): array
    {
        $groupJoin = null !== $playerGroupId ? ' JOIN g.session s_grp' : '';
        $groupWhere = null !== $playerGroupId ? ' AND s_grp.playerGroup = :group' : '';

        $countQuery = $this->em->createQuery(
            'SELECT IDENTITY(g.taker) AS playerId, p.name AS playerName, p.color AS playerColor,
                    g.contract AS contract, COUNT(g.id) AS count
             FROM App\Entity\Game g
             JOIN g.taker p'.$groupJoin.'
             WHERE g.status = :status'.$groupWhere.'
             GROUP BY g.taker, p.color, p.name, g.contract'
        )
            ->setParameter('status', GameStatus::Completed);

        $this->setGroupParameter($countQuery, $playerGroupId);

        /** @var list<array{contract: Contract, count: int|string, playerColor: string|null, playerId: int|string, playerName: string}> $countRows */
        $countRows = $countQuery->getResult();

        if (empty($countRows)) {
            return [];
        }

        $winQuery = $this->em->createQuery(
            'SELECT IDENTITY(g.taker) AS playerId, g.contract AS contract, COUNT(g.id) AS wins
             FROM App\Entity\Game g
             JOIN App\Entity\ScoreEntry se WITH se.game = g AND se.player = g.taker'.$groupJoin.'
             WHERE g.status = :status AND se.score > 0'.$groupWhere.'
             GROUP BY g.taker, g.contract'
        )
            ->setParameter('status', GameStatus::Completed);

        $this->setGroupParameter($winQuery, $playerGroupId);

        /** @var list<array{contract: Contract, playerId: int|string, wins: int|string}> $winRows */
        $winRows = $winQuery->getResult();

        /** @var array<string, int> $winsMap */
        $winsMap = [];
        foreach ($winRows as $row) {
            $winsMap[(int) $row['playerId'].'_'.$row['contract']->value] = (int) $row['wins'];
        }

        /** @var array<int, array{color: string|null, contracts: list<array{contract: string, count: int, winRate: float, wins: int}>, id: int, name: string}> $grouped */
        $grouped = [];
        foreach ($countRows as $row) {
            $playerId = (int) $row['playerId'];
            $contract = $row['contract']->value;
            $count = (int) $row['count'];
            $wins = $winsMap[$playerId.'_'.$contract] ?? 0;

            if (!isset($grouped[$playerId])) {
                $grouped[$playerId] = [
                    'color' => $row['playerColor'],
                    'contracts' => [],
                    'id' => $playerId,
                    'name' => $row['playerName'],
                ];
            }

            $grouped[$playerId]['contracts'][] = [
                'contract' => $contract,
                'count' => $count,
                'winRate' => $count > 0 ? \round($wins / $count * 100, 1) : 0.0,
                'wins' => $wins,
            ];
        }

        return \array_values($grouped);
    }

    /**
     * Répartition des contrats joués (nombre et pourcentage sur le total des donnes).
     *
     * @return list<array{contract: string, count: int, percentage: float}>
     */
    public function getContractDistribution(?int $playerGroupId = null): array
    {
        $total = $this->getTotalGames($playerGroupId);
        if (0 === $total) {
            return [];
        }

        $groupJoin = null !== $playerGroupId ? ' JOIN g.session s_grp' : '';
        $groupWhere = null !== $playerGroupId ? ' AND s_grp.playerGroup = :group' : '';

        $query = $this->em->createQuery(
            'SELECT g.contract AS contract, COUNT(g.id) AS count
             FROM App\Entity\Game g'.$groupJoin.'
             WHERE g.status = :status'.$groupWhere.'
             GROUP BY g.contract
             ORDER BY count DESC'
        )
            ->setParameter('status', GameStatus::Completed);

        $this->setGroupParameter($query, $playerGroupId);

        /** @var list<array{contract: Contract, count: int|string}> $rows */
        $rows = $query->getResult();

        return \array_map(
            static fn (array $row) => [
                'contract' => $row['contract']->value,
                'count' => (int) $row['count'],
                'percentage' => \round((int) $row['count'] / $total * 100, 2),
            ],
            $rows,
        );
    }

    /**
     * Historique ELO complet de tous les joueurs, trié par ordre chronologique.
     *
     * Utilisé pour tracer le graphique d'évolution globale ELO.
     * Les résultats sont groupés par joueur (playerId → liste de points).
     *
     * @return list<array{history: list<array{date: string, gameId: int, ratingAfter: int}>, playerColor: string|null, playerId: int, playerName: string}>
     */
    public function getAllPlayersEloHistory(?int $playerGroupId = null): array
    {
        $groupJoin = null !== $playerGroupId ? ' JOIN eh.game g_grp JOIN g_grp.session s_grp' : '';
        $groupWhere = null !== $playerGroupId ? ' WHERE s_grp.playerGroup = :group' : '';

        $query = $this->em->createQuery(
            'SELECT IDENTITY(eh.player) AS playerId, p.name AS playerName, p.color AS playerColor,
                    eh.createdAt AS date, IDENTITY(eh.game) AS gameId, eh.ratingAfter AS ratingAfter
             FROM App\Entity\EloHistory eh
             JOIN eh.player p'.$groupJoin.$groupWhere.'
             ORDER BY eh.id ASC'
        );

        $this->setGroupParameter($query, $playerGroupId);

        /** @var list<array{date: \DateTimeImmutable, gameId: int|string, playerColor: string|null, playerId: int|string, playerName: string, ratingAfter: int|string}> $rows */
        $rows = $query->getResult();

        /** @var array<int, array{history: list<array{date: string, gameId: int, ratingAfter: int}>, playerColor: string|null, playerId: int, playerName: string}> $grouped */
        $grouped = [];
        foreach ($rows as $row) {
            $playerId = (int) $row['playerId'];
            if (!isset($grouped[$playerId])) {
                $grouped[$playerId] = [
                    'history' => [],
                    'playerColor' => $row['playerColor'],
                    'playerId' => $playerId,
                    'playerName' => $row['playerName'],
                ];
            }
            $grouped[$playerId]['history'][] = [
                'date' => $row['date']->format(\DateTimeInterface::ATOM),
                'gameId' => (int) $row['gameId'],
                'ratingAfter' => (int) $row['ratingAfter'],
            ];
        }

        return \array_values($grouped);
    }

    /**
     * Classement ELO courant de tous les joueurs ayant un historique ELO.
     *
     * Trié par eloRating décroissant. Le nombre de parties jouées est déduit
     * du nombre d'entrées distinctes dans EloHistory (une par donne).
     *
     * @return list<array{eloRating: int, gamesPlayed: int, playerColor: string|null, playerId: int, playerName: string}>
     */
    public function getEloRanking(?int $playerGroupId = null): array
    {
        $groupJoin = null !== $playerGroupId ? ' JOIN eh.game g_grp JOIN g_grp.session s_grp' : '';
        $groupWhere = null !== $playerGroupId ? ' WHERE s_grp.playerGroup = :group' : '';

        $query = $this->em->createQuery(
            'SELECT IDENTITY(eh.player) AS playerId, p.name AS playerName, p.color AS playerColor, p.eloRating AS eloRating,
                    COUNT(DISTINCT eh.game) AS gamesPlayed
             FROM App\Entity\EloHistory eh
             JOIN eh.player p'.$groupJoin.$groupWhere.'
             GROUP BY eh.player, p.color, p.name, p.eloRating
             ORDER BY eloRating DESC'
        );

        $this->setGroupParameter($query, $playerGroupId);

        /** @var list<array{eloRating: int|string, gamesPlayed: int|string, playerColor: string|null, playerId: int|string, playerName: string}> $rows */
        $rows = $query->getResult();

        return \array_map(
            static fn (array $row) => [
                'eloRating' => (int) $row['eloRating'],
                'gamesPlayed' => (int) $row['gamesPlayed'],
                'playerColor' => $row['playerColor'],
                'playerId' => (int) $row['playerId'],
                'playerName' => $row['playerName'],
            ],
            $rows,
        );
    }

    /**
     * Classement général des joueurs par score total décroissant.
     *
     * Agrège quatre requêtes DQL :
     * 1. Score total par joueur (inclut les pénalités étoiles via ScoreEntry sans game).
     * 2. Nombre de donnes jouées (via ScoreEntry avec game complété).
     * 3. Nombre de donnes en tant que preneur.
     * 4. Nombre de victoires en tant que preneur (score preneur > 0).
     *
     * Le winRate est calculé comme : victoires / donnes en tant que preneur × 100.
     *
     * @return list<array{gamesAsTaker: int, gamesPlayed: int, playerColor: string|null, playerId: int, playerName: string, totalScore: int, winRate: float, wins: int}>
     */
    public function getLeaderboard(?int $playerGroupId = null): array
    {
        $groupJoin = null !== $playerGroupId ? ' LEFT JOIN g.session s_grp' : '';
        $groupWhere = null !== $playerGroupId ? ' AND s_grp.playerGroup = :group' : '';
        $groupStarJoin = null !== $playerGroupId ? ' LEFT JOIN se.session s_star' : '';
        $groupStarWhere = null !== $playerGroupId ? ' AND s_star.playerGroup = :group' : '';

        $scoreQuery = $this->em->createQuery(
            'SELECT IDENTITY(se.player) AS playerId, p.name AS playerName, p.color AS playerColor, SUM(se.score) AS totalScore
             FROM App\Entity\ScoreEntry se
             JOIN se.player p
             LEFT JOIN se.game g'.$groupJoin.$groupStarJoin.'
             WHERE (g IS NOT NULL AND g.status = :status'.$groupWhere.') OR (se.game IS NULL'.$groupStarWhere.')
             GROUP BY se.player, p.color, p.name
             ORDER BY totalScore DESC'
        )
            ->setParameter('status', GameStatus::Completed);

        $this->setGroupParameter($scoreQuery, $playerGroupId);

        /** @var list<array{playerColor: string|null, playerId: int|string, playerName: string, totalScore: int|string}> $scoreRows */
        $scoreRows = $scoreQuery->getResult();

        if (empty($scoreRows)) {
            return [];
        }

        $gamesPlayedQuery = $this->em->createQuery(
            'SELECT IDENTITY(se.player) AS playerId, COUNT(DISTINCT se.game) AS gamesPlayed
             FROM App\Entity\ScoreEntry se
             JOIN se.game g'.$groupJoin.'
             WHERE g.status = :status'.$groupWhere.'
             GROUP BY se.player'
        )
            ->setParameter('status', GameStatus::Completed);

        $this->setGroupParameter($gamesPlayedQuery, $playerGroupId);

        /** @var list<array{gamesPlayed: int|string, playerId: int|string}> $gamesPlayedRows */
        $gamesPlayedRows = $gamesPlayedQuery->getResult();

        /** @var array<int, int> $gamesPlayed */
        $gamesPlayed = [];
        foreach ($gamesPlayedRows as $row) {
            $gamesPlayed[(int) $row['playerId']] = (int) $row['gamesPlayed'];
        }

        $takerQuery = $this->em->createQuery(
            'SELECT IDENTITY(g.taker) AS playerId, COUNT(g.id) AS gamesAsTaker
             FROM App\Entity\Game g'.$groupJoin.'
             WHERE g.status = :status'.$groupWhere.'
             GROUP BY g.taker'
        )
            ->setParameter('status', GameStatus::Completed);

        $this->setGroupParameter($takerQuery, $playerGroupId);

        /** @var list<array{gamesAsTaker: int|string, playerId: int|string}> $takerRows */
        $takerRows = $takerQuery->getResult();

        /** @var array<int, int> $gamesAsTaker */
        $gamesAsTaker = [];
        foreach ($takerRows as $row) {
            $gamesAsTaker[(int) $row['playerId']] = (int) $row['gamesAsTaker'];
        }

        $winQuery = $this->em->createQuery(
            'SELECT IDENTITY(g.taker) AS playerId, COUNT(g.id) AS wins
             FROM App\Entity\Game g
             JOIN App\Entity\ScoreEntry se WITH se.game = g AND se.player = g.taker'.$groupJoin.'
             WHERE g.status = :status AND se.score > 0'.$groupWhere.'
             GROUP BY g.taker'
        )
            ->setParameter('status', GameStatus::Completed);

        $this->setGroupParameter($winQuery, $playerGroupId);

        /** @var list<array{playerId: int|string, wins: int|string}> $winRows */
        $winRows = $winQuery->getResult();

        /** @var array<int, int> $wins */
        $wins = [];
        foreach ($winRows as $row) {
            $wins[(int) $row['playerId']] = (int) $row['wins'];
        }

        return \array_map(
            static fn (array $row) => [
                'gamesAsTaker' => $gamesAsTaker[(int) $row['playerId']] ?? 0,
                'gamesPlayed' => $gamesPlayed[(int) $row['playerId']] ?? 0,
                'playerColor' => $row['playerColor'],
                'playerId' => (int) $row['playerId'],
                'playerName' => $row['playerName'],
                'totalScore' => (int) $row['totalScore'],
                'winRate' => ($gamesAsTaker[(int) $row['playerId']] ?? 0) > 0
                    ? \round(($wins[(int) $row['playerId']] ?? 0) / $gamesAsTaker[(int) $row['playerId']] * 100, 1)
                    : 0.0,
                'wins' => $wins[(int) $row['playerId']] ?? 0,
            ],
            $scoreRows,
        );
    }

    /**
     * Durée moyenne d'une donne en secondes (entre createdAt et completedAt).
     */
    public function getAverageGameDurationSeconds(?int $playerGroupId = null): ?int
    {
        $groupJoin = null !== $playerGroupId ? ' JOIN g.session s_grp' : '';
        $groupWhere = null !== $playerGroupId ? ' AND s_grp.playerGroup = :group' : '';

        $query = $this->em->createQuery(
            'SELECT AVG(TIMESTAMPDIFF(SECOND, g.createdAt, g.completedAt))
             FROM App\Entity\Game g'.$groupJoin.'
             WHERE g.status = :status AND g.completedAt IS NOT NULL'.$groupWhere
        )
            ->setParameter('status', GameStatus::Completed);

        $this->setGroupParameter($query, $playerGroupId);

        /** @var string|null $avg */
        $avg = $query->getSingleScalarResult();

        return null !== $avg ? (int) \round((float) $avg) : null;
    }

    /**
     * Temps de jeu total cumulé en secondes (somme des durées de toutes les donnes).
     */
    public function getTotalPlayTimeSeconds(?int $playerGroupId = null): int
    {
        $groupJoin = null !== $playerGroupId ? ' JOIN g.session s_grp' : '';
        $groupWhere = null !== $playerGroupId ? ' AND s_grp.playerGroup = :group' : '';

        $query = $this->em->createQuery(
            'SELECT SUM(TIMESTAMPDIFF(SECOND, g.createdAt, g.completedAt))
             FROM App\Entity\Game g'.$groupJoin.'
             WHERE g.status = :status AND g.completedAt IS NOT NULL'.$groupWhere
        )
            ->setParameter('status', GameStatus::Completed);

        $this->setGroupParameter($query, $playerGroupId);

        /** @var string|null $total */
        $total = $query->getSingleScalarResult();

        return (int) ($total ?? 0);
    }

    /** Nombre total d'étoiles (StarEvent) attribuées. */
    public function getTotalStars(?int $playerGroupId = null): int
    {
        $groupJoin = null !== $playerGroupId ? ' JOIN App\Entity\Session s_grp WITH se.session = s_grp' : '';
        $groupWhere = null !== $playerGroupId ? ' WHERE s_grp.playerGroup = :group' : '';

        $query = $this->em->createQuery(
            'SELECT COUNT(se.id) FROM App\Entity\StarEvent se'.$groupJoin.$groupWhere
        );

        $this->setGroupParameter($query, $playerGroupId);

        return (int) $query->getSingleScalarResult();
    }

    /** Nombre total de donnes terminées (status = Completed). */
    public function getTotalGames(?int $playerGroupId = null): int
    {
        $groupJoin = null !== $playerGroupId ? ' JOIN g.session s_grp' : '';
        $groupWhere = null !== $playerGroupId ? ' AND s_grp.playerGroup = :group' : '';

        $query = $this->em->createQuery(
            'SELECT COUNT(g.id) FROM App\Entity\Game g'.$groupJoin.'
             WHERE g.status = :status'.$groupWhere
        )
            ->setParameter('status', GameStatus::Completed);

        $this->setGroupParameter($query, $playerGroupId);

        return (int) $query->getSingleScalarResult();
    }

    /** Nombre total de sessions créées. */
    public function getTotalSessions(?int $playerGroupId = null): int
    {
        $groupWhere = null !== $playerGroupId ? ' WHERE s.playerGroup = :group' : '';

        $query = $this->em->createQuery(
            'SELECT COUNT(s.id) FROM App\Entity\Session s'.$groupWhere
        );

        $this->setGroupParameter($query, $playerGroupId);

        return (int) $query->getSingleScalarResult();
    }

    /**
     * Ajoute le paramètre :group à une requête DQL si un filtre de groupe est actif.
     *
     * @param AbstractQuery<mixed, mixed> $query
     */
    private function setGroupParameter(AbstractQuery $query, ?int $playerGroupId): void
    {
        if (null !== $playerGroupId) {
            $query->setParameter('group', $playerGroupId);
        }
    }
}
