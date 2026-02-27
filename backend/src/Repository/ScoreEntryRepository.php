<?php

declare(strict_types=1);

namespace App\Repository;

use App\Dto\BestSessionTotalDto;
use App\Dto\CumulativeScoreDto;
use App\Dto\DateRange;
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
        return $this->findExtremeTakerGameForSession($session, 'DESC');
    }

    public function findWorstTakerGameForSession(Session $session): ?TakerGameHighlightDto
    {
        return $this->findExtremeTakerGameForSession($session, 'ASC');
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

        /** @var list<CumulativeScoreDto> */
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

    /**
     * @return array<int, list<int>> playerId => ordered list of game scores
     */
    public function getOrderedGameScoresPerPlayerForSession(Session $session): array
    {
        /** @var list<array{playerId: int|string, score: int|string}> $results */
        $results = $this->createQueryBuilder('se')
            ->select('IDENTITY(se.player) AS playerId', 'se.score AS score')
            ->join('se.game', 'g')
            ->andWhere('g.session = :session')
            ->andWhere('g.status = :status')
            ->setParameter('session', $session)
            ->setParameter('status', GameStatus::Completed)
            ->orderBy('g.position', 'ASC')
            ->getQuery()
            ->getResult();

        $map = [];
        foreach ($results as $row) {
            $map[(int) $row['playerId']][] = (int) $row['score'];
        }

        return $map;
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
     * @param list<int> $sessionIds
     *
     * @return array<int, list<ScoreEntryPositionDto>> sessionId => entries ordered by position
     */
    public function getEntriesForSessionsByPosition(array $sessionIds): array
    {
        if ([] === $sessionIds) {
            return [];
        }

        /** @var list<ScoreEntryPositionDto> $dtos */
        $dtos = $this->createQueryBuilder('se')
            ->select('NEW App\Dto\ScoreEntryPositionDto(IDENTITY(g.session), IDENTITY(se.player), g.position, se.score)')
            ->join('se.game', 'g')
            ->andWhere('g.session IN (:sessionIds)')
            ->andWhere('g.status = :status')
            ->setParameter('sessionIds', $sessionIds)
            ->setParameter('status', GameStatus::Completed)
            ->orderBy('g.session', 'ASC')
            ->addOrderBy('g.position', 'ASC')
            ->getQuery()
            ->getResult();

        /** @var array<int, list<ScoreEntryPositionDto>> $map */
        $map = \array_fill_keys($sessionIds, []);
        foreach ($dtos as $dto) {
            $map[$dto->sessionId][] = $dto;
        }

        return $map;
    }

    /**
     * @param list<int> $sessionIds
     *
     * @return array<int, list<PlayerScoreSumDto>> sessionId => score sums ordered ASC
     */
    public function getScoreSumsByPlayerForSessions(array $sessionIds): array
    {
        if ([] === $sessionIds) {
            return [];
        }

        /** @var list<PlayerScoreSumDto> $dtos */
        $dtos = $this->createQueryBuilder('se')
            ->select('NEW App\Dto\PlayerScoreSumDto(IDENTITY(g.session), IDENTITY(se.player), SUM(se.score))')
            ->join('se.game', 'g')
            ->andWhere('g.session IN (:sessionIds)')
            ->andWhere('g.status = :status')
            ->setParameter('sessionIds', $sessionIds)
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('g.session')
            ->addGroupBy('se.player')
            ->orderBy('g.session', 'ASC')
            ->addOrderBy('SUM(se.score)', 'ASC')
            ->getQuery()
            ->getResult();

        /** @var array<int, list<PlayerScoreSumDto>> $map */
        $map = \array_fill_keys($sessionIds, []);
        foreach ($dtos as $dto) {
            $map[$dto->sessionId][] = $dto;
        }

        return $map;
    }

    /**
     * @return array{averageScore: float, totalScore: int}
     */
    public function getPlayerScoreInSharedSessions(Player $player, Player $other, ?DateRange $dateRange = null, ?int $playerGroupId = null): array
    {
        $qb = $this->createQueryBuilder('se')
            ->select('AVG(se.score) AS averageScore', 'SUM(se.score) AS totalScore')
            ->join('se.game', 'g')
            ->join('g.session', 's')
            ->join('s.players', 'p1')
            ->join('s.players', 'p2')
            ->andWhere('p1 = :player1')
            ->andWhere('p2 = :player2')
            ->andWhere('se.player = :player')
            ->andWhere('g.status = :status')
            ->setParameter('player', $player)
            ->setParameter('player1', $player)
            ->setParameter('player2', $other)
            ->setParameter('status', GameStatus::Completed);

        $this->applyDateFilter($qb, $dateRange, 'g', 'completedAt');
        if (null !== $playerGroupId) {
            $qb->andWhere('s.playerGroup = :group')
               ->setParameter('group', $playerGroupId);
        }

        /** @var array{averageScore: float|string|null, totalScore: int|string|null} $result */
        $result = $qb->getQuery()->getSingleResult();

        return [
            'averageScore' => null !== $result['averageScore'] ? (float) $result['averageScore'] : 0.0,
            'totalScore' => (int) ($result['totalScore'] ?? 0),
        ];
    }

    /**
     * @return array{averageScore: float, bestGameScore: int, gamesPlayed: int, totalScore: int, worstGameScore: int}
     */
    public function getPlayerScoreAggregates(Player $player, ?DateRange $dateRange = null, ?int $playerGroupId = null): array
    {
        $qb = $this->createQueryBuilder('se')
            ->select('COUNT(se.id) AS gamesPlayed', 'SUM(se.score) AS totalScore', 'AVG(se.score) AS averageScore', 'MAX(se.score) AS bestGameScore', 'MIN(se.score) AS worstGameScore')
            ->join('se.game', 'g')
            ->andWhere('se.player = :player')
            ->andWhere('g.status = :status')
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed);

        $this->applyDateFilter($qb, $dateRange, 'g', 'completedAt');
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
    public function getPlayerRecentScores(Player $player, ?DateRange $dateRange = null, ?int $playerGroupId = null, int $limit = 50): array
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

        $this->applyDateFilter($qb, $dateRange, 'g', 'completedAt');
        $this->applyGroupFilter($qb, $playerGroupId);

        /** @var list<RecentScoreDto> */
        return $qb->getQuery()->getResult();
    }

    public function getPlayerBestScore(Player $player, ?DateRange $dateRange = null, ?int $playerGroupId = null): ?PlayerExtremeScoreDto
    {
        return $this->getPlayerExtremeScore($player, 'DESC', $dateRange, $playerGroupId);
    }

    public function getPlayerWorstScore(Player $player, ?DateRange $dateRange = null, ?int $playerGroupId = null): ?PlayerExtremeScoreDto
    {
        return $this->getPlayerExtremeScore($player, 'ASC', $dateRange, $playerGroupId);
    }

    public function getPlayerBestSessionTotal(Player $player, ?DateRange $dateRange = null, ?int $playerGroupId = null): ?BestSessionTotalDto
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

        $this->applyDateFilter($qb, $dateRange, 'g', 'completedAt');
        $this->applyGroupFilter($qb, $playerGroupId);

        /** @var list<BestSessionTotalDto> $results */
        $results = $qb->getQuery()->getResult();

        return $results[0] ?? null;
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

        /** @var list<GameTakerScoreDto> $dtos */
        $dtos = $this->createQueryBuilder('se')
            ->select('NEW App\Dto\GameTakerScoreDto(IDENTITY(se.player), g.id, IDENTITY(g.partner), g.poignee, g.poigneeOwner, IDENTITY(g.taker), se2.score)')
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
        foreach ($dtos as $dto) {
            $map[$dto->playerId][] = $dto;
        }

        return $map;
    }

    /**
     * @return list<LeaderboardScoreDto>
     */
    public function getLeaderboardScores(?DateRange $dateRange = null, ?int $playerGroupId = null): array
    {
        $qb = $this->createQueryBuilder('se')
            ->select('NEW App\Dto\LeaderboardScoreDto(p.color, IDENTITY(se.player), p.name, SUM(se.score))')
            ->join('se.player', 'p')
            ->leftJoin('se.game', 'g')
            ->groupBy('se.player')
            ->addGroupBy('p.color')
            ->addGroupBy('p.name')
            ->orderBy('SUM(se.score)', 'DESC');

        if (null !== $playerGroupId || null !== $dateRange) {
            $qb->leftJoin('g.session', 's_game_grp')
               ->leftJoin('se.session', 's_star_grp');

            $gameConditions = ['g IS NOT NULL', 'g.status = :status'];
            $starConditions = ['se.game IS NULL'];
            $qb->setParameter('status', GameStatus::Completed);

            if (null !== $playerGroupId) {
                $gameConditions[] = 's_game_grp.playerGroup = :group';
                $starConditions[] = 's_star_grp.playerGroup = :group';
                $qb->setParameter('group', $playerGroupId);
            }

            if (null !== $dateRange) {
                if (null !== $dateRange->from) {
                    $gameConditions[] = 'g.completedAt >= :dateFrom';
                    $starConditions[] = 's_star_grp.createdAt >= :dateFrom';
                    $qb->setParameter('dateFrom', $dateRange->from);
                }

                if (null !== $dateRange->to) {
                    $gameConditions[] = 'g.completedAt <= :dateTo';
                    $starConditions[] = 's_star_grp.createdAt <= :dateTo';
                    $qb->setParameter('dateTo', $dateRange->to);
                }
            }

            $qb->andWhere(
                '('.\implode(' AND ', $gameConditions).') OR ('.\implode(' AND ', $starConditions).')',
            );
        } else {
            $qb->andWhere('(g IS NOT NULL AND g.status = :status) OR se.game IS NULL')
               ->setParameter('status', GameStatus::Completed);
        }

        /** @var list<LeaderboardScoreDto> */
        return $qb->getQuery()->getResult();
    }

    /**
     * @return list<GamesPlayedCountDto>
     */
    public function countGamesPlayedByPlayer(?DateRange $dateRange = null, ?int $playerGroupId = null): array
    {
        $qb = $this->createQueryBuilder('se')
            ->select('NEW App\Dto\GamesPlayedCountDto(COUNT(DISTINCT se.game), IDENTITY(se.player))')
            ->join('se.game', 'g')
            ->andWhere('g.status = :status')
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('se.player');

        $this->applyDateFilter($qb, $dateRange, 'g', 'completedAt');
        $this->applyGroupFilter($qb, $playerGroupId);

        /** @var list<GamesPlayedCountDto> */
        return $qb->getQuery()->getResult();
    }

    private function findExtremeTakerGameForSession(Session $session, string $order): ?TakerGameHighlightDto
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
            ->orderBy('se.score', $order)
            ->setMaxResults(1)
            ->getQuery()
            ->getResult();

        return $results[0] ?? null;
    }

    private function getPlayerExtremeScore(Player $player, string $order, ?DateRange $dateRange = null, ?int $playerGroupId = null): ?PlayerExtremeScoreDto
    {
        $qb = $this->createQueryBuilder('se')
            ->select('NEW App\Dto\PlayerExtremeScoreDto(g.contract, g.createdAt, IDENTITY(se.game), se.score, IDENTITY(g.session))')
            ->join('se.game', 'g')
            ->andWhere('se.player = :player')
            ->andWhere('g.status = :status')
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->orderBy('se.score', $order)
            ->setMaxResults(1);

        $this->applyDateFilter($qb, $dateRange, 'g', 'completedAt');
        $this->applyGroupFilter($qb, $playerGroupId);

        /** @var list<PlayerExtremeScoreDto> $results */
        $results = $qb->getQuery()->getResult();

        return $results[0] ?? null;
    }
}
