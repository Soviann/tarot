<?php

declare(strict_types=1);

namespace App\Repository;

use App\Dto\BestSessionTotalDto;
use App\Dto\CumulativeScoreDto;
use App\Dto\GamesPlayedCountDto;
use App\Dto\GameTakerScoreDto;
use App\Dto\LeaderboardScoreDto;
use App\Dto\PlayerExtremeScoreDto;
use App\Dto\PlayerScoreSumDto;
use App\Dto\RecentScoreDto;
use App\Dto\ScoreEntryPositionDto;
use App\Dto\TakerGameHighlightDto;
use App\Dto\TotalTakerScoreDto;
use App\Entity\Player;
use App\Entity\ScoreEntry;
use App\Entity\Session;
use App\Enum\GameStatus;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ScoreEntry>
 */
final class ScoreEntryRepository extends ServiceEntityRepository
{
    use GroupFilterTrait;

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ScoreEntry::class);
    }

    public function findBestTakerGameForSession(Session $session): ?TakerGameHighlightDto
    {
        /** @var list<TakerGameHighlightDto> $results */
        $results = $this->createQueryBuilder('se')
            ->select('NEW App\Dto\TakerGameHighlightDto(g.contract, g.id, p.name, se.score)')
            ->join('se.game', 'g')
            ->join('g.taker', 'p')
            ->andWhere('g.session = :session')
            ->andWhere('g.status = :status')
            ->andWhere('se.player = g.taker')
            ->setParameter('session', $session)
            ->setParameter('status', GameStatus::Completed)
            ->orderBy('se.score', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getResult();

        return $results[0] ?? null;
    }

    public function findWorstTakerGameForSession(Session $session): ?TakerGameHighlightDto
    {
        /** @var list<TakerGameHighlightDto> $results */
        $results = $this->createQueryBuilder('se')
            ->select('NEW App\Dto\TakerGameHighlightDto(g.contract, g.id, p.name, se.score)')
            ->join('se.game', 'g')
            ->join('g.taker', 'p')
            ->andWhere('g.session = :session')
            ->andWhere('g.status = :status')
            ->andWhere('se.player = g.taker')
            ->setParameter('session', $session)
            ->setParameter('status', GameStatus::Completed)
            ->orderBy('se.score', 'ASC')
            ->setMaxResults(1)
            ->getQuery()
            ->getResult();

        return $results[0] ?? null;
    }

    /**
     * @return list<CumulativeScoreDto>
     */
    public function getCumulativeScoresForSession(Session $session): array
    {
        $qb = $this->createQueryBuilder('se')
            ->select('NEW App\Dto\CumulativeScoreDto(IDENTITY(se.player), p.name, SUM(se.score))')
            ->leftJoin('se.game', 'g')
            ->join('se.player', 'p')
            ->andWhere('g.session = :session OR (se.game IS NULL AND se.session = :session)')
            ->setParameter('session', $session)
            ->groupBy('se.player')
            ->addGroupBy('p.name')
            ->orderBy('p.name', 'ASC');

        /* @var list<CumulativeScoreDto> */
        return $qb->getQuery()->getResult();
    }

    /**
     * @return array<int, int> playerId => totalScore
     */
    public function getCompletedGameScoresByPlayer(Session $session): array
    {
        /** @var list<array{playerId: int|string, totalScore: int|string}> $results */
        $results = $this->createQueryBuilder('se')
            ->select('IDENTITY(se.player) AS playerId', 'SUM(se.score) AS totalScore')
            ->join('se.game', 'g')
            ->andWhere('g.session = :session')
            ->andWhere('g.status = :status')
            ->setParameter('session', $session)
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('se.player')
            ->getQuery()
            ->getResult();

        $scoreMap = [];
        foreach ($results as $row) {
            $scoreMap[(int) $row['playerId']] = (int) $row['totalScore'];
        }

        return $scoreMap;
    }

    /**
     * @return array<int, int> playerId => totalScore
     */
    public function getStarPenaltyScoresByPlayer(Session $session): array
    {
        /** @var list<array{playerId: int|string, totalScore: int|string}> $results */
        $results = $this->createQueryBuilder('se')
            ->select('IDENTITY(se.player) AS playerId', 'SUM(se.score) AS totalScore')
            ->andWhere('se.session = :session')
            ->andWhere('se.game IS NULL')
            ->setParameter('session', $session)
            ->groupBy('se.player')
            ->getQuery()
            ->getResult();

        $scoreMap = [];
        foreach ($results as $row) {
            $scoreMap[(int) $row['playerId']] = (int) $row['totalScore'];
        }

        return $scoreMap;
    }

    public function getTotalTakerScoreByPlayerForSession(Session $session): ?TotalTakerScoreDto
    {
        /** @var list<TotalTakerScoreDto> $results */
        $results = $this->createQueryBuilder('se')
            ->select('NEW App\Dto\TotalTakerScoreDto(p.color, IDENTITY(g.taker), p.name, SUM(se.score))')
            ->join('se.game', 'g')
            ->join('g.taker', 'p')
            ->andWhere('g.session = :session')
            ->andWhere('g.status = :status')
            ->andWhere('se.player = g.taker')
            ->setParameter('session', $session)
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('g.taker')
            ->addGroupBy('p.name')
            ->addGroupBy('p.color')
            ->orderBy('SUM(se.score)', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getResult();

        return $results[0] ?? null;
    }

    public function countCompletedGameEntriesForPlayer(Player $player): int
    {
        return (int) $this->createQueryBuilder('se')
            ->select('COUNT(se.id)')
            ->join('se.game', 'g')
            ->andWhere('se.player = :player')
            ->andWhere('g.status = :status')
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * @param list<int> $playerIds
     *
     * @return array<int, int> playerId => count
     */
    public function countCompletedGameEntriesForPlayers(array $playerIds): array
    {
        if ([] === $playerIds) {
            return [];
        }

        /** @var list<array{cnt: int|string, playerId: int|string}> $results */
        $results = $this->createQueryBuilder('se')
            ->select('COUNT(se.id) AS cnt', 'IDENTITY(se.player) AS playerId')
            ->join('se.game', 'g')
            ->andWhere('se.player IN (:playerIds)')
            ->andWhere('g.status = :status')
            ->setParameter('playerIds', $playerIds)
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('se.player')
            ->getQuery()
            ->getResult();

        $map = \array_fill_keys($playerIds, 0);
        foreach ($results as $row) {
            $map[(int) $row['playerId']] = (int) $row['cnt'];
        }

        return $map;
    }

    public function countDistinctCompletedSessionsForPlayer(Player $player): int
    {
        return (int) $this->createQueryBuilder('se')
            ->select('COUNT(DISTINCT g.session)')
            ->join('se.game', 'g')
            ->andWhere('se.player = :player')
            ->andWhere('g.status = :status')
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * @param list<int> $playerIds
     *
     * @return array<int, int> playerId => count
     */
    public function countDistinctCompletedSessionsForPlayers(array $playerIds): array
    {
        if ([] === $playerIds) {
            return [];
        }

        /** @var list<array{cnt: int|string, playerId: int|string}> $results */
        $results = $this->createQueryBuilder('se')
            ->select('COUNT(DISTINCT g.session) AS cnt', 'IDENTITY(se.player) AS playerId')
            ->join('se.game', 'g')
            ->andWhere('se.player IN (:playerIds)')
            ->andWhere('g.status = :status')
            ->setParameter('playerIds', $playerIds)
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('se.player')
            ->getQuery()
            ->getResult();

        $map = \array_fill_keys($playerIds, 0);
        foreach ($results as $row) {
            $map[(int) $row['playerId']] = (int) $row['cnt'];
        }

        return $map;
    }

    public function countNightOwlGamesForPlayer(Player $player): int
    {
        return (int) $this->createQueryBuilder('se')
            ->select('COUNT(se.id)')
            ->join('se.game', 'g')
            ->andWhere('se.player = :player')
            ->andWhere('g.status = :status')
            ->andWhere('g.completedAt IS NOT NULL')
            ->andWhere('HOUR(g.completedAt) >= 0')
            ->andWhere('HOUR(g.completedAt) < 5')
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * @param list<int> $playerIds
     *
     * @return array<int, int> playerId => count
     */
    public function countNightOwlGamesForPlayers(array $playerIds): array
    {
        if ([] === $playerIds) {
            return [];
        }

        /** @var list<array{cnt: int|string, playerId: int|string}> $results */
        $results = $this->createQueryBuilder('se')
            ->select('COUNT(se.id) AS cnt', 'IDENTITY(se.player) AS playerId')
            ->join('se.game', 'g')
            ->andWhere('se.player IN (:playerIds)')
            ->andWhere('g.status = :status')
            ->andWhere('g.completedAt IS NOT NULL')
            ->andWhere('HOUR(g.completedAt) >= 0')
            ->andWhere('HOUR(g.completedAt) < 5')
            ->setParameter('playerIds', $playerIds)
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('se.player')
            ->getQuery()
            ->getResult();

        $map = \array_fill_keys($playerIds, 0);
        foreach ($results as $row) {
            $map[(int) $row['playerId']] = (int) $row['cnt'];
        }

        return $map;
    }

    /**
     * @return list<int>
     */
    public function getDistinctCompletedSessionIdsForPlayer(Player $player): array
    {
        /** @var list<array{sessionId: int|string}> $results */
        $results = $this->createQueryBuilder('se')
            ->select('DISTINCT IDENTITY(se.session) AS sessionId')
            ->join('se.game', 'g')
            ->andWhere('se.player = :player')
            ->andWhere('g.status = :status')
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->getQuery()
            ->getResult();

        return \array_map(static fn (array $row): int => (int) $row['sessionId'], $results);
    }

    /**
     * @param list<int> $playerIds
     *
     * @return array<int, list<int>> playerId => list of session IDs
     */
    public function getDistinctCompletedSessionIdsForPlayers(array $playerIds): array
    {
        if ([] === $playerIds) {
            return [];
        }

        /** @var list<array{playerId: int|string, sessionId: int|string}> $results */
        $results = $this->createQueryBuilder('se')
            ->select('DISTINCT IDENTITY(se.player) AS playerId', 'IDENTITY(se.session) AS sessionId')
            ->join('se.game', 'g')
            ->andWhere('se.player IN (:playerIds)')
            ->andWhere('g.status = :status')
            ->setParameter('playerIds', $playerIds)
            ->setParameter('status', GameStatus::Completed)
            ->getQuery()
            ->getResult();

        /** @var array<int, list<int>> $map */
        $map = \array_fill_keys($playerIds, []);
        foreach ($results as $row) {
            $map[(int) $row['playerId']][] = (int) $row['sessionId'];
        }

        return $map;
    }

    /**
     * @return list<ScoreEntryPositionDto>
     */
    public function getEntriesForSessionByPosition(int $sessionId): array
    {
        /* @var list<ScoreEntryPositionDto> */
        return $this->createQueryBuilder('se')
            ->select('NEW App\Dto\ScoreEntryPositionDto(IDENTITY(se.player), g.position, se.score)')
            ->join('se.game', 'g')
            ->andWhere('g.session = :session')
            ->andWhere('g.status = :status')
            ->setParameter('session', $sessionId)
            ->setParameter('status', GameStatus::Completed)
            ->orderBy('g.position', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * @return list<PlayerScoreSumDto>
     */
    public function getScoreSumsByPlayerForSession(int $sessionId): array
    {
        /* @var list<PlayerScoreSumDto> */
        return $this->createQueryBuilder('se')
            ->select('NEW App\Dto\PlayerScoreSumDto(IDENTITY(se.player), SUM(se.score))')
            ->join('se.game', 'g')
            ->andWhere('g.session = :session')
            ->andWhere('g.status = :status')
            ->setParameter('session', $sessionId)
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('se.player')
            ->orderBy('SUM(se.score)', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * @return array{averageScore: float, bestGameScore: int, gamesPlayed: int, totalScore: int, worstGameScore: int}
     */
    public function getPlayerScoreAggregates(Player $player, ?int $playerGroupId = null): array
    {
        $qb = $this->createQueryBuilder('se')
            ->select('COUNT(se.id) AS gamesPlayed', 'SUM(se.score) AS totalScore', 'AVG(se.score) AS averageScore', 'MAX(se.score) AS bestGameScore', 'MIN(se.score) AS worstGameScore')
            ->join('se.game', 'g')
            ->andWhere('se.player = :player')
            ->andWhere('g.status = :status')
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed);

        $this->applyGroupFilter($qb, $playerGroupId);

        /** @var array{averageScore: float|string|null, bestGameScore: int|string|null, gamesPlayed: int|string, totalScore: int|string|null, worstGameScore: int|string|null} $result */
        $result = $qb->getQuery()->getSingleResult();

        return [
            'averageScore' => null !== $result['averageScore'] ? (float) $result['averageScore'] : 0.0,
            'bestGameScore' => (int) ($result['bestGameScore'] ?? 0),
            'gamesPlayed' => (int) $result['gamesPlayed'],
            'totalScore' => (int) ($result['totalScore'] ?? 0),
            'worstGameScore' => (int) ($result['worstGameScore'] ?? 0),
        ];
    }

    /**
     * @return list<RecentScoreDto>
     */
    public function getPlayerRecentScores(Player $player, ?int $playerGroupId = null, int $limit = 50): array
    {
        $qb = $this->createQueryBuilder('se')
            ->select('NEW App\Dto\RecentScoreDto(g.createdAt, g.id, se.score, IDENTITY(g.session))')
            ->join('se.game', 'g')
            ->andWhere('se.player = :player')
            ->andWhere('g.status = :status')
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->orderBy('g.createdAt', 'DESC')
            ->setMaxResults($limit);

        $this->applyGroupFilter($qb, $playerGroupId);

        /* @var list<RecentScoreDto> */
        return $qb->getQuery()->getResult();
    }

    public function getPlayerBestScore(Player $player, ?int $playerGroupId = null): ?PlayerExtremeScoreDto
    {
        $qb = $this->createQueryBuilder('se')
            ->select('NEW App\Dto\PlayerExtremeScoreDto(g.contract, g.createdAt, se.score, IDENTITY(g.session))')
            ->join('se.game', 'g')
            ->andWhere('se.player = :player')
            ->andWhere('g.status = :status')
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->orderBy('se.score', 'DESC')
            ->setMaxResults(1);

        $this->applyGroupFilter($qb, $playerGroupId);

        /** @var list<PlayerExtremeScoreDto> $results */
        $results = $qb->getQuery()->getResult();

        return $results[0] ?? null;
    }

    public function getPlayerWorstScore(Player $player, ?int $playerGroupId = null): ?PlayerExtremeScoreDto
    {
        $qb = $this->createQueryBuilder('se')
            ->select('NEW App\Dto\PlayerExtremeScoreDto(g.contract, g.createdAt, se.score, IDENTITY(g.session))')
            ->join('se.game', 'g')
            ->andWhere('se.player = :player')
            ->andWhere('g.status = :status')
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->orderBy('se.score', 'ASC')
            ->setMaxResults(1);

        $this->applyGroupFilter($qb, $playerGroupId);

        /** @var list<PlayerExtremeScoreDto> $results */
        $results = $qb->getQuery()->getResult();

        return $results[0] ?? null;
    }

    public function getPlayerBestSessionTotal(Player $player, ?int $playerGroupId = null): ?BestSessionTotalDto
    {
        $qb = $this->createQueryBuilder('se')
            ->select('NEW App\Dto\BestSessionTotalDto(MIN(g.createdAt), IDENTITY(g.session), SUM(se.score))')
            ->join('se.game', 'g')
            ->andWhere('se.player = :player')
            ->andWhere('g.status = :status')
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('g.session')
            ->orderBy('SUM(se.score)', 'DESC')
            ->setMaxResults(1);

        $this->applyGroupFilter($qb, $playerGroupId);

        /** @var list<BestSessionTotalDto> $results */
        $results = $qb->getQuery()->getResult();

        return $results[0] ?? null;
    }

    /**
     * @return list<GameTakerScoreDto>
     */
    public function getGamesWithTakerScoreForPlayer(Player $player): array
    {
        /* @var list<GameTakerScoreDto> */
        return $this->createQueryBuilder('se')
            ->select('NEW App\Dto\GameTakerScoreDto(g.id, IDENTITY(g.partner), IDENTITY(g.taker), se2.score)')
            ->join('se.game', 'g')
            ->join('g.scoreEntries', 'se2')
            ->andWhere('se.player = :player')
            ->andWhere('g.status = :status')
            ->andWhere('se2.player = g.taker')
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->orderBy('g.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * @param list<int> $playerIds
     *
     * @return array<int, list<GameTakerScoreDto>> playerId => taker score DTOs
     */
    public function getGamesWithTakerScoreForPlayers(array $playerIds): array
    {
        if ([] === $playerIds) {
            return [];
        }

        /** @var list<array{gameId: int|string, partnerId: int|string|null, playerId: int|string, takerId: int|string, takerScore: int|string}> $results */
        $results = $this->createQueryBuilder('se')
            ->select(
                'g.id AS gameId',
                'IDENTITY(g.partner) AS partnerId',
                'IDENTITY(se.player) AS playerId',
                'IDENTITY(g.taker) AS takerId',
                'se2.score AS takerScore',
            )
            ->join('se.game', 'g')
            ->join('g.scoreEntries', 'se2')
            ->andWhere('se.player IN (:playerIds)')
            ->andWhere('g.status = :status')
            ->andWhere('se2.player = g.taker')
            ->setParameter('playerIds', $playerIds)
            ->setParameter('status', GameStatus::Completed)
            ->orderBy('g.createdAt', 'ASC')
            ->getQuery()
            ->getResult();

        /** @var array<int, list<GameTakerScoreDto>> $map */
        $map = \array_fill_keys($playerIds, []);
        foreach ($results as $row) {
            $map[(int) $row['playerId']][] = new GameTakerScoreDto(
                $row['gameId'],
                $row['partnerId'],
                $row['takerId'],
                $row['takerScore'],
            );
        }

        return $map;
    }

    /**
     * @return list<LeaderboardScoreDto>
     */
    public function getLeaderboardScores(?int $playerGroupId = null): array
    {
        $qb = $this->createQueryBuilder('se')
            ->select('NEW App\Dto\LeaderboardScoreDto(p.color, IDENTITY(se.player), p.name, SUM(se.score))')
            ->join('se.player', 'p')
            ->leftJoin('se.game', 'g')
            ->groupBy('se.player')
            ->addGroupBy('p.color')
            ->addGroupBy('p.name')
            ->orderBy('SUM(se.score)', 'DESC');

        if (null !== $playerGroupId) {
            $qb->leftJoin('App\Entity\Session', 's_grp', 'WITH', 'se.session = s_grp')
               ->andWhere('(g IS NOT NULL AND g.status = :status AND s_grp.playerGroup = :group) OR (se.game IS NULL AND s_grp.playerGroup = :group)')
               ->setParameter('status', GameStatus::Completed)
               ->setParameter('group', $playerGroupId);
        } else {
            $qb->andWhere('(g IS NOT NULL AND g.status = :status) OR se.game IS NULL')
               ->setParameter('status', GameStatus::Completed);
        }

        /* @var list<LeaderboardScoreDto> */
        return $qb->getQuery()->getResult();
    }

    /**
     * @return list<GamesPlayedCountDto>
     */
    public function countGamesPlayedByPlayer(?int $playerGroupId = null): array
    {
        $qb = $this->createQueryBuilder('se')
            ->select('NEW App\Dto\GamesPlayedCountDto(COUNT(DISTINCT se.game), IDENTITY(se.player))')
            ->join('se.game', 'g')
            ->andWhere('g.status = :status')
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('se.player');

        if (null !== $playerGroupId) {
            $qb->join('g.session', 's_grp')
               ->andWhere('s_grp.playerGroup = :group')
               ->setParameter('group', $playerGroupId);
        }

        /* @var list<GamesPlayedCountDto> */
        return $qb->getQuery()->getResult();
    }
}
