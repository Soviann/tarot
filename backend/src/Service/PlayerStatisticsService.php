<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Player;
use App\Entity\PlayerGroup;
use App\Enum\BadgeType;
use App\Enum\Contract;
use App\Enum\GameStatus;
use App\Service\Scoring\ScoreCalculator;
use Doctrine\ORM\AbstractQuery;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Statistiques individuelles d'un joueur.
 *
 * Alimente la page « Statistiques joueur » (route GET /api/statistics/players/{id}).
 * Accepte un $playerGroupId optionnel pour filtrer sur un groupe donné.
 *
 * La méthode principale getPlayerStats() agrège en un seul appel :
 * - Scores (moyenne, meilleur, pire, total par rôle)
 * - Répartition des contrats et taux de réussite
 * - Historique ELO et classement
 * - Records personnels (meilleur score, pire score, plus longue série de victoires, plus gros écart)
 * - Étoiles, pénalités, badges débloqués
 * - 50 derniers scores (pour le graphique de tendance)
 * - Durée moyenne et totale de jeu
 */
class PlayerStatisticsService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
    ) {
    }

    /**
     * Historique ELO d'un joueur, trié chronologiquement.
     *
     * Chaque entrée correspond à une donne et inclut la variation (ratingChange)
     * en plus de la valeur absolue (ratingAfter).
     *
     * @return list<array{date: string, gameId: int, ratingAfter: int, ratingChange: int}>
     */
    public function getPlayerEloHistory(Player $player, ?int $playerGroupId = null): array
    {
        $groupJoin = null !== $playerGroupId ? ' JOIN eh.game g_grp JOIN g_grp.session s_grp' : '';
        $groupWhere = null !== $playerGroupId ? ' AND s_grp.playerGroup = :group' : '';

        $query = $this->em->createQuery(
            'SELECT eh.createdAt AS date, IDENTITY(eh.game) AS gameId, eh.ratingAfter AS ratingAfter, eh.ratingChange AS ratingChange
             FROM App\Entity\EloHistory eh'.$groupJoin.'
             WHERE eh.player = :player'.$groupWhere.'
             ORDER BY eh.id ASC'
        )
            ->setParameter('player', $player);

        $this->setGroupParameter($query, $playerGroupId);

        /** @var list<array{date: \DateTimeImmutable, gameId: int|string, ratingAfter: int|string, ratingChange: int|string}> $rows */
        $rows = $query->getResult();

        return \array_map(
            static fn (array $row) => [
                'date' => $row['date']->format(\DateTimeInterface::ATOM),
                'gameId' => (int) $row['gameId'],
                'ratingAfter' => (int) $row['ratingAfter'],
                'ratingChange' => (int) $row['ratingChange'],
            ],
            $rows,
        );
    }

    /**
     * Records personnels d'un joueur.
     *
     * Types de records calculés :
     * - best_score    : meilleur score individuel (tous rôles)
     * - worst_score   : pire score individuel (tous rôles)
     * - win_streak    : plus longue série de victoires consécutives en tant que preneur
     * - biggest_diff  : plus grand écart entre points réalisés et points requis (en tant que preneur)
     * - best_session  : meilleur score cumulé sur une session
     *
     * @return list<array{contract: string|null, date: string, sessionId: int|null, type: string, value: int|float}>
     */
    public function getPlayerRecords(Player $player, ?int $playerGroupId = null): array
    {
        $groupJoinGame = null !== $playerGroupId ? ' JOIN g.session s_grp' : '';
        $groupWhereGame = null !== $playerGroupId ? ' AND s_grp.playerGroup = :group' : '';

        $records = [];

        // 1. Best score (any role)
        $bestQuery = $this->em->createQuery(
            'SELECT se.score, g.createdAt AS date, IDENTITY(g.session) AS sessionId, g.contract AS contract
             FROM App\Entity\ScoreEntry se
             JOIN se.game g'.$groupJoinGame.'
             WHERE se.player = :player AND g.status = :status'.$groupWhereGame.'
             ORDER BY se.score DESC'
        )
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->setMaxResults(1);

        $this->setGroupParameter($bestQuery, $playerGroupId);

        /** @var list<array{contract: Contract, date: \DateTimeImmutable, score: int|string, sessionId: int|string}> $bestRows */
        $bestRows = $bestQuery->getResult();

        if (!empty($bestRows)) {
            $row = $bestRows[0];
            $records[] = [
                'contract' => $row['contract']->value,
                'date' => $row['date']->format(\DateTimeInterface::ATOM),
                'sessionId' => (int) $row['sessionId'],
                'type' => 'best_score',
                'value' => (int) $row['score'],
            ];
        }

        // 2. Worst score (any role)
        $worstQuery = $this->em->createQuery(
            'SELECT se.score, g.createdAt AS date, IDENTITY(g.session) AS sessionId, g.contract AS contract
             FROM App\Entity\ScoreEntry se
             JOIN se.game g'.$groupJoinGame.'
             WHERE se.player = :player AND g.status = :status'.$groupWhereGame.'
             ORDER BY se.score ASC'
        )
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->setMaxResults(1);

        $this->setGroupParameter($worstQuery, $playerGroupId);

        /** @var list<array{contract: Contract, date: \DateTimeImmutable, score: int|string, sessionId: int|string}> $worstRows */
        $worstRows = $worstQuery->getResult();

        if (!empty($worstRows)) {
            $row = $worstRows[0];
            $records[] = [
                'contract' => $row['contract']->value,
                'date' => $row['date']->format(\DateTimeInterface::ATOM),
                'sessionId' => (int) $row['sessionId'],
                'type' => 'worst_score',
                'value' => (int) $row['score'],
            ];
        }

        // 3. Win streak + Biggest diff (as taker) — single query
        $takerQuery = $this->em->createQuery(
            'SELECT se.score, g.createdAt AS date, IDENTITY(g.session) AS sessionId,
                    g.contract AS contract, g.points AS points, g.oudlers AS oudlers
             FROM App\Entity\Game g
             JOIN App\Entity\ScoreEntry se WITH se.game = g AND se.player = g.taker'.$groupJoinGame.'
             WHERE g.taker = :player AND g.status = :status'.$groupWhereGame.'
             ORDER BY g.createdAt ASC'
        )
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed);

        $this->setGroupParameter($takerQuery, $playerGroupId);

        /** @var list<array{contract: Contract, date: \DateTimeImmutable, oudlers: int|null, points: float|null, score: int|string, sessionId: int|string}> $takerRows */
        $takerRows = $takerQuery->getResult();

        if (!empty($takerRows)) {
            // Win streak
            $currentStreak = 0;
            $maxStreak = 0;
            $maxStreakEndDate = null;

            foreach ($takerRows as $row) {
                if ((int) $row['score'] > 0) {
                    ++$currentStreak;
                    if ($currentStreak > $maxStreak) {
                        $maxStreak = $currentStreak;
                        $maxStreakEndDate = $row['date'];
                    }
                } else {
                    $currentStreak = 0;
                }
            }

            if ($maxStreak > 0 && null !== $maxStreakEndDate) {
                $records[] = [
                    'contract' => null,
                    'date' => $maxStreakEndDate->format(\DateTimeInterface::ATOM),
                    'sessionId' => null,
                    'type' => 'win_streak',
                    'value' => $maxStreak,
                ];
            }

            // Biggest point difference
            $maxDiff = 0.0;
            $maxDiffRow = null;

            foreach ($takerRows as $row) {
                if (null === $row['points'] || null === $row['oudlers']) {
                    continue;
                }
                $required = ScoreCalculator::REQUIRED_POINTS[(int) $row['oudlers']] ?? 56;
                $diff = \abs((float) $row['points'] - $required);
                if ($diff > $maxDiff) {
                    $maxDiff = $diff;
                    $maxDiffRow = $row;
                }
            }

            if (null !== $maxDiffRow) {
                $records[] = [
                    'contract' => $maxDiffRow['contract']->value,
                    'date' => $maxDiffRow['date']->format(\DateTimeInterface::ATOM),
                    'sessionId' => (int) $maxDiffRow['sessionId'],
                    'type' => 'biggest_diff',
                    'value' => $maxDiff,
                ];
            }
        }

        // 4. Best session total
        $sessionQuery = $this->em->createQuery(
            'SELECT IDENTITY(g.session) AS sessionId, SUM(se.score) AS total, MIN(g.createdAt) AS firstDate
             FROM App\Entity\ScoreEntry se
             JOIN se.game g'.$groupJoinGame.'
             WHERE se.player = :player AND g.status = :status'.$groupWhereGame.'
             GROUP BY g.session
             ORDER BY total DESC'
        )
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->setMaxResults(1);

        $this->setGroupParameter($sessionQuery, $playerGroupId);

        /** @var list<array{firstDate: string, sessionId: int|string, total: int|string}> $sessionRows */
        $sessionRows = $sessionQuery->getResult();

        if (!empty($sessionRows)) {
            $row = $sessionRows[0];
            $records[] = [
                'contract' => null,
                'date' => (new \DateTimeImmutable($row['firstDate']))->format(\DateTimeInterface::ATOM),
                'sessionId' => (int) $row['sessionId'],
                'type' => 'best_session',
                'value' => (int) $row['total'],
            ];
        }

        return $records;
    }

    /**
     * Agrège toutes les statistiques d'un joueur en un seul tableau.
     *
     * Exécute de nombreuses requêtes DQL pour collecter :
     * - Scores agrégés (moyenne, min, max, total)
     * - Nombre de donnes par rôle (preneur, partenaire, défenseur)
     * - Taux de victoire en tant que preneur
     * - Répartition des contrats avec taux de réussite
     * - 50 derniers scores (graphique de tendance)
     * - Étoiles et pénalités associées (1 pénalité pour 3 étoiles)
     * - Badges (débloqués et verrouillés)
     * - Historique ELO et records personnels
     * - Durée moyenne et totale de jeu
     *
     * @return array{badges: list<array{description: string, emoji: string, label: string, type: string, unlockedAt: string|null}>, averageGameDurationSeconds: int|null, averageScore: float, bestGameScore: int, contractDistribution: list<array{contract: string, count: int, winRate: float, wins: int}>, eloHistory: list<array{date: string, gameId: int, ratingAfter: int, ratingChange: int}>, eloRating: int, gamesAsDefender: int, gamesAsPartner: int, gamesAsTaker: int, gamesPlayed: int, player: array{id: int|null, name: string}, playerGroups: list<array{id: int|null, name: string}>, recentScores: list<array{date: string, gameId: int, score: int, sessionId: int}>, records: list<array{contract: string|null, date: string, sessionId: int|null, type: string, value: int|float}>, sessionsPlayed: int, starPenalties: int, totalPlayTimeSeconds: int, totalStars: int, winRateAsTaker: float, worstGameScore: int}
     */
    public function getPlayerStats(Player $player, ?int $playerGroupId = null): array
    {
        $playerId = $player->getId();

        $groupJoinGame = null !== $playerGroupId ? ' JOIN g.session s_grp' : '';
        $groupWhereGame = null !== $playerGroupId ? ' AND s_grp.playerGroup = :group' : '';

        $scoreAggQuery = $this->em->createQuery(
            'SELECT COUNT(se.id) AS gamesPlayed, SUM(se.score) AS totalScore,
                    AVG(se.score) AS averageScore, MAX(se.score) AS bestGameScore, MIN(se.score) AS worstGameScore
             FROM App\Entity\ScoreEntry se
             JOIN se.game g'.$groupJoinGame.'
             WHERE se.player = :player AND g.status = :status'.$groupWhereGame
        )
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed);

        $this->setGroupParameter($scoreAggQuery, $playerGroupId);

        /** @var array{averageScore: float|string|null, bestGameScore: int|string|null, gamesPlayed: int|string, totalScore: int|string|null, worstGameScore: int|string|null} $scoreAgg */
        $scoreAgg = $scoreAggQuery->getSingleResult();

        $gamesPlayed = (int) $scoreAgg['gamesPlayed'];

        $gamesAsTakerQuery = $this->em->createQuery(
            'SELECT COUNT(g.id)
             FROM App\Entity\Game g'.$groupJoinGame.'
             WHERE g.taker = :player AND g.status = :status'.$groupWhereGame
        )
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed);

        $this->setGroupParameter($gamesAsTakerQuery, $playerGroupId);
        $gamesAsTaker = (int) $gamesAsTakerQuery->getSingleScalarResult();

        $gamesAsPartnerQuery = $this->em->createQuery(
            'SELECT COUNT(g.id)
             FROM App\Entity\Game g'.$groupJoinGame.'
             WHERE g.partner = :player AND g.status = :status'.$groupWhereGame
        )
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed);

        $this->setGroupParameter($gamesAsPartnerQuery, $playerGroupId);
        $gamesAsPartner = (int) $gamesAsPartnerQuery->getSingleScalarResult();

        $gamesAsDefender = $gamesPlayed - $gamesAsTaker - $gamesAsPartner;

        $winsAsTakerQuery = $this->em->createQuery(
            'SELECT COUNT(g.id)
             FROM App\Entity\Game g
             JOIN App\Entity\ScoreEntry se WITH se.game = g AND se.player = g.taker'.$groupJoinGame.'
             WHERE g.taker = :player AND g.status = :status AND se.score > 0'.$groupWhereGame
        )
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed);

        $this->setGroupParameter($winsAsTakerQuery, $playerGroupId);
        $winsAsTaker = (int) $winsAsTakerQuery->getSingleScalarResult();

        $sessionsQuery = $this->em->createQuery(
            'SELECT COUNT(DISTINCT g.session)
             FROM App\Entity\Game g
             JOIN App\Entity\ScoreEntry se WITH se.game = g AND se.player = :player'.$groupJoinGame.'
             WHERE g.status = :status'.$groupWhereGame
        )
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed);

        $this->setGroupParameter($sessionsQuery, $playerGroupId);
        $sessionsPlayed = (int) $sessionsQuery->getSingleScalarResult();

        $contractQuery = $this->em->createQuery(
            'SELECT g.contract AS contract, COUNT(g.id) AS count
             FROM App\Entity\Game g'.$groupJoinGame.'
             WHERE g.taker = :player AND g.status = :status'.$groupWhereGame.'
             GROUP BY g.contract'
        )
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed);

        $this->setGroupParameter($contractQuery, $playerGroupId);

        /** @var list<array{contract: Contract, count: int|string}> $contractRows */
        $contractRows = $contractQuery->getResult();

        $contractWinQuery = $this->em->createQuery(
            'SELECT g.contract AS contract, COUNT(g.id) AS wins
             FROM App\Entity\Game g
             JOIN App\Entity\ScoreEntry se WITH se.game = g AND se.player = g.taker'.$groupJoinGame.'
             WHERE g.taker = :player AND g.status = :status AND se.score > 0'.$groupWhereGame.'
             GROUP BY g.contract'
        )
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed);

        $this->setGroupParameter($contractWinQuery, $playerGroupId);

        /** @var list<array{contract: Contract, wins: int|string}> $contractWinRows */
        $contractWinRows = $contractWinQuery->getResult();

        /** @var array<string, int> $contractWins */
        $contractWins = [];
        foreach ($contractWinRows as $row) {
            $contractWins[$row['contract']->value] = (int) $row['wins'];
        }

        $contractDistribution = \array_map(
            static fn (array $row) => [
                'contract' => $row['contract']->value,
                'count' => (int) $row['count'],
                'winRate' => (int) $row['count'] > 0
                    ? \round(($contractWins[$row['contract']->value] ?? 0) / (int) $row['count'] * 100, 1)
                    : 0.0,
                'wins' => $contractWins[$row['contract']->value] ?? 0,
            ],
            $contractRows,
        );

        $recentScoresQuery = $this->em->createQuery(
            'SELECT se.score AS score, g.id AS gameId, g.createdAt AS date, IDENTITY(g.session) AS sessionId
             FROM App\Entity\ScoreEntry se
             JOIN se.game g'.$groupJoinGame.'
             WHERE se.player = :player AND g.status = :status'.$groupWhereGame.'
             ORDER BY g.createdAt DESC'
        )
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->setMaxResults(50);

        $this->setGroupParameter($recentScoresQuery, $playerGroupId);

        /** @var list<array{date: \DateTimeImmutable, gameId: int|string, score: int|string, sessionId: int|string}> $recentScores */
        $recentScores = $recentScoresQuery->getResult();

        $formattedRecentScores = \array_map(
            static fn (array $row) => [
                'date' => $row['date']->format(\DateTimeInterface::ATOM),
                'gameId' => (int) $row['gameId'],
                'score' => (int) $row['score'],
                'sessionId' => (int) $row['sessionId'],
            ],
            $recentScores,
        );

        $groupJoinStar = null !== $playerGroupId ? ' JOIN App\Entity\Session s_grp WITH se.session = s_grp' : '';
        $groupWhereStar = null !== $playerGroupId ? ' AND s_grp.playerGroup = :group' : '';

        $starsQuery = $this->em->createQuery(
            'SELECT COUNT(se.id) FROM App\Entity\StarEvent se'.$groupJoinStar.'
             WHERE se.player = :player'.$groupWhereStar
        )
            ->setParameter('player', $player);

        $this->setGroupParameter($starsQuery, $playerGroupId);
        $totalStars = (int) $starsQuery->getSingleScalarResult();

        $starPenalties = (int) \floor($totalStars / 3);

        $durationStats = $this->getPlayerDurationStats($player, $playerGroupId);

        return [
            'averageGameDurationSeconds' => $durationStats['averageGameDurationSeconds'],
            'badges' => $this->getPlayerBadges($player),
            'averageScore' => null !== $scoreAgg['averageScore'] ? \round((float) $scoreAgg['averageScore'], 1) : 0.0,
            'bestGameScore' => (int) ($scoreAgg['bestGameScore'] ?? 0),
            'contractDistribution' => $contractDistribution,
            'eloHistory' => $this->getPlayerEloHistory($player, $playerGroupId),
            'eloRating' => $player->getEloRating(),
            'gamesAsDefender' => $gamesAsDefender,
            'gamesAsPartner' => $gamesAsPartner,
            'gamesAsTaker' => $gamesAsTaker,
            'gamesPlayed' => $gamesPlayed,
            'player' => ['id' => $playerId, 'name' => $player->getName()],
            'playerGroups' => \array_map(
                static fn (PlayerGroup $pg) => ['id' => $pg->getId(), 'name' => $pg->getName()],
                $player->getPlayerGroups()->getValues(),
            ),
            'recentScores' => $formattedRecentScores,
            'records' => $this->getPlayerRecords($player, $playerGroupId),
            'sessionsPlayed' => $sessionsPlayed,
            'starPenalties' => $starPenalties,
            'totalPlayTimeSeconds' => $durationStats['totalPlayTimeSeconds'],
            'totalStars' => $totalStars,
            'winRateAsTaker' => $gamesAsTaker > 0 ? \round($winsAsTaker / $gamesAsTaker * 100, 1) : 0.0,
            'worstGameScore' => (int) ($scoreAgg['worstGameScore'] ?? 0),
        ];
    }

    /**
     * Durée moyenne et totale de jeu d'un joueur (basé sur les donnes auxquelles il a participé).
     *
     * @return array{averageGameDurationSeconds: int|null, totalPlayTimeSeconds: int}
     */
    public function getPlayerDurationStats(Player $player, ?int $playerGroupId = null): array
    {
        $groupJoin = null !== $playerGroupId ? ' JOIN g.session s_grp' : '';
        $groupWhere = null !== $playerGroupId ? ' AND s_grp.playerGroup = :group' : '';

        $query = $this->em->createQuery(
            'SELECT AVG(TIMESTAMPDIFF(SECOND, g.createdAt, g.completedAt)) AS avg,
                    SUM(TIMESTAMPDIFF(SECOND, g.createdAt, g.completedAt)) AS total
             FROM App\Entity\Game g
             JOIN App\Entity\ScoreEntry se WITH se.game = g AND se.player = :player'.$groupJoin.'
             WHERE g.status = :status AND g.completedAt IS NOT NULL'.$groupWhere
        )
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed);

        $this->setGroupParameter($query, $playerGroupId);

        /** @var array{avg: string|null, total: string|null} $row */
        $row = $query->getSingleResult();

        return [
            'averageGameDurationSeconds' => null !== $row['avg'] ? (int) \round((float) $row['avg']) : null,
            'totalPlayTimeSeconds' => (int) ($row['total'] ?? 0),
        ];
    }

    /**
     * Liste tous les badges (débloqués et verrouillés) pour un joueur.
     *
     * Itère sur tous les BadgeType possibles et enrichit chacun avec la date
     * de déverrouillage (null si pas encore obtenu).
     *
     * @return list<array{description: string, emoji: string, label: string, type: string, unlockedAt: string|null}>
     */
    private function getPlayerBadges(Player $player): array
    {
        /** @var list<array{badgeType: BadgeType, unlockedAt: \DateTimeImmutable}> $awarded */
        $awarded = $this->em->createQuery(
            'SELECT pb.badgeType, pb.unlockedAt FROM App\Entity\PlayerBadge pb
             WHERE pb.player = :player ORDER BY pb.unlockedAt ASC'
        )
            ->setParameter('player', $player)
            ->getResult();

        $awardedMap = [];
        foreach ($awarded as $row) {
            $awardedMap[$row['badgeType']->value] = $row['unlockedAt']->format(\DateTimeInterface::ATOM);
        }

        $badges = [];
        foreach (BadgeType::cases() as $badgeType) {
            $badges[] = [
                ...$badgeType->toArray(),
                'unlockedAt' => $awardedMap[$badgeType->value] ?? null,
            ];
        }

        return $badges;
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
