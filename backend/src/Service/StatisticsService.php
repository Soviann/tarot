<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Player;
use App\Entity\PlayerGroup;
use App\Enum\Contract;
use App\Enum\GameStatus;
use Doctrine\ORM\AbstractQuery;
use Doctrine\ORM\EntityManagerInterface;

class StatisticsService
{
    private const REQUIRED_POINTS = [0 => 56, 1 => 51, 2 => 41, 3 => 36];

    public function __construct(
        private readonly EntityManagerInterface $em,
    ) {
    }

    /**
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
                'winRate' => $count > 0 ? round($wins / $count * 100, 1) : 0.0,
                'wins' => $wins,
            ];
        }

        return array_values($grouped);
    }

    /**
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

        return array_map(
            static fn (array $row) => [
                'contract' => $row['contract']->value,
                'count' => (int) $row['count'],
                'percentage' => round((int) $row['count'] / $total * 100, 2),
            ],
            $rows,
        );
    }

    /**
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

        return array_values($grouped);
    }

    /**
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

        return array_map(
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

        return array_map(
            static fn (array $row) => [
                'gamesAsTaker' => $gamesAsTaker[(int) $row['playerId']] ?? 0,
                'gamesPlayed' => $gamesPlayed[(int) $row['playerId']] ?? 0,
                'playerColor' => $row['playerColor'],
                'playerId' => (int) $row['playerId'],
                'playerName' => $row['playerName'],
                'totalScore' => (int) $row['totalScore'],
                'winRate' => ($gamesAsTaker[(int) $row['playerId']] ?? 0) > 0
                    ? round(($wins[(int) $row['playerId']] ?? 0) / $gamesAsTaker[(int) $row['playerId']] * 100, 1)
                    : 0.0,
                'wins' => $wins[(int) $row['playerId']] ?? 0,
            ],
            $scoreRows,
        );
    }

    /**
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

        return array_map(
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
                $required = self::REQUIRED_POINTS[(int) $row['oudlers']] ?? 56;
                $diff = abs((float) $row['points'] - $required);
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
     * @return array{averageGameDurationSeconds: int|null, averageScore: float, bestGameScore: int, contractDistribution: list<array{contract: string, count: int, winRate: float, wins: int}>, eloHistory: list<array{date: string, gameId: int, ratingAfter: int, ratingChange: int}>, eloRating: int, gamesAsDefender: int, gamesAsPartner: int, gamesAsTaker: int, gamesPlayed: int, player: array{id: int|null, name: string}, playerGroups: list<array{id: int|null, name: string}>, recentScores: list<array{date: string, gameId: int, score: int, sessionId: int}>, records: list<array{contract: string|null, date: string, sessionId: int|null, type: string, value: int|float}>, sessionsPlayed: int, starPenalties: int, totalPlayTimeSeconds: int, totalStars: int, winRateAsTaker: float, worstGameScore: int}
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

        $contractDistribution = array_map(
            static fn (array $row) => [
                'contract' => $row['contract']->value,
                'count' => (int) $row['count'],
                'winRate' => (int) $row['count'] > 0
                    ? round(($contractWins[$row['contract']->value] ?? 0) / (int) $row['count'] * 100, 1)
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

        $formattedRecentScores = array_map(
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

        $starPenalties = (int) floor($totalStars / 3);

        $durationStats = $this->getPlayerDurationStats($player, $playerGroupId);

        return [
            'averageGameDurationSeconds' => $durationStats['averageGameDurationSeconds'],
            'averageScore' => null !== $scoreAgg['averageScore'] ? round((float) $scoreAgg['averageScore'], 1) : 0.0,
            'bestGameScore' => (int) ($scoreAgg['bestGameScore'] ?? 0),
            'contractDistribution' => $contractDistribution,
            'eloHistory' => $this->getPlayerEloHistory($player, $playerGroupId),
            'eloRating' => $player->getEloRating(),
            'gamesAsDefender' => $gamesAsDefender,
            'gamesAsPartner' => $gamesAsPartner,
            'gamesAsTaker' => $gamesAsTaker,
            'gamesPlayed' => $gamesPlayed,
            'player' => ['id' => $playerId, 'name' => $player->getName()],
            'playerGroups' => array_map(
                static fn (PlayerGroup $pg) => ['id' => $pg->getId(), 'name' => $pg->getName()],
                $player->getPlayerGroups()->getValues(),
            ),
            'recentScores' => $formattedRecentScores,
            'records' => $this->getPlayerRecords($player, $playerGroupId),
            'sessionsPlayed' => $sessionsPlayed,
            'starPenalties' => $starPenalties,
            'totalPlayTimeSeconds' => $durationStats['totalPlayTimeSeconds'],
            'totalStars' => $totalStars,
            'winRateAsTaker' => $gamesAsTaker > 0 ? round($winsAsTaker / $gamesAsTaker * 100, 1) : 0.0,
            'worstGameScore' => (int) ($scoreAgg['worstGameScore'] ?? 0),
        ];
    }

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

        return null !== $avg ? (int) round((float) $avg) : null;
    }

    /**
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
            'averageGameDurationSeconds' => null !== $row['avg'] ? (int) round((float) $row['avg']) : null,
            'totalPlayTimeSeconds' => (int) ($row['total'] ?? 0),
        ];
    }

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
     * @param AbstractQuery<mixed, mixed> $query
     */
    private function setGroupParameter(AbstractQuery $query, ?int $playerGroupId): void
    {
        if (null !== $playerGroupId) {
            $query->setParameter('group', $playerGroupId);
        }
    }
}
