<?php

declare(strict_types=1);

namespace App\Repository;

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
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ScoreEntry::class);
    }

    /**
     * @return array{contract: string, gameId: int, playerName: string, score: int}|null
     */
    public function findBestTakerGameForSession(Session $session): ?array
    {
        /** @var list<array{contract: \App\Enum\Contract, gameId: int|string, playerName: string, score: int|string}> $results */
        $results = $this->createQueryBuilder('se')
            ->select('g.id AS gameId', 'p.name AS playerName', 'g.contract AS contract', 'se.score AS score')
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

        if (empty($results)) {
            return null;
        }

        $row = $results[0];

        return [
            'contract' => $row['contract']->value,
            'gameId' => (int) $row['gameId'],
            'playerName' => $row['playerName'],
            'score' => (int) $row['score'],
        ];
    }

    /**
     * @return array{contract: string, gameId: int, playerName: string, score: int}|null
     */
    public function findWorstTakerGameForSession(Session $session): ?array
    {
        /** @var list<array{contract: \App\Enum\Contract, gameId: int|string, playerName: string, score: int|string}> $results */
        $results = $this->createQueryBuilder('se')
            ->select('g.id AS gameId', 'p.name AS playerName', 'g.contract AS contract', 'se.score AS score')
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

        if (empty($results)) {
            return null;
        }

        $row = $results[0];

        return [
            'contract' => $row['contract']->value,
            'gameId' => (int) $row['gameId'],
            'playerName' => $row['playerName'],
            'score' => (int) $row['score'],
        ];
    }

    /**
     * @return array<array{playerId: int, playerName: string, score: int}>
     */
    public function getCumulativeScoresForSession(Session $session): array
    {
        /** @var list<array{playerId: int|string, playerName: string, totalScore: string}> $results */
        $results = $this->createQueryBuilder('se')
            ->select('IDENTITY(se.player) AS playerId', 'p.name AS playerName', 'SUM(se.score) AS totalScore')
            ->leftJoin('se.game', 'g')
            ->join('se.player', 'p')
            ->andWhere('g.session = :session OR (se.game IS NULL AND se.session = :session)')
            ->setParameter('session', $session)
            ->groupBy('se.player')
            ->addGroupBy('p.name')
            ->orderBy('p.name', 'ASC')
            ->getQuery()
            ->getResult();

        return array_map(static fn (array $row) => [
            'playerId' => $row['playerId'],
            'playerName' => $row['playerName'],
            'score' => (int) $row['totalScore'],
        ], $results);
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
     * @return array{playerColor: string|null, playerId: int, playerName: string, totalTakerScore: int}|null
     */
    public function getTotalTakerScoreByPlayerForSession(Session $session): ?array
    {
        /** @var list<array{playerColor: string|null, playerId: int|string, playerName: string, totalTakerScore: int|string}> $results */
        $results = $this->createQueryBuilder('se')
            ->select('IDENTITY(g.taker) AS playerId', 'p.name AS playerName', 'p.color AS playerColor', 'SUM(se.score) AS totalTakerScore')
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
            ->orderBy('totalTakerScore', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getResult();

        if (empty($results)) {
            return null;
        }

        $row = $results[0];

        return [
            'playerColor' => $row['playerColor'],
            'playerId' => (int) $row['playerId'],
            'playerName' => $row['playerName'],
            'totalTakerScore' => (int) $row['totalTakerScore'],
        ];
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

        return array_map(static fn (array $row): int => (int) $row['sessionId'], $results);
    }

    /**
     * @return list<array{playerId: int, position: int, score: int}>
     */
    public function getEntriesForSessionByPosition(int $sessionId): array
    {
        /** @var list<array{playerId: int|string, position: int|string, score: int|string}> $results */
        $results = $this->createQueryBuilder('se')
            ->select('IDENTITY(se.player) AS playerId', 'se.score', 'g.position')
            ->join('se.game', 'g')
            ->andWhere('g.session = :session')
            ->andWhere('g.status = :status')
            ->setParameter('session', $sessionId)
            ->setParameter('status', GameStatus::Completed)
            ->orderBy('g.position', 'ASC')
            ->getQuery()
            ->getResult();

        return array_map(static fn (array $row) => [
            'playerId' => (int) $row['playerId'],
            'position' => (int) $row['position'],
            'score' => (int) $row['score'],
        ], $results);
    }

    /**
     * @return list<array{playerId: int, totalScore: int}>
     */
    public function getScoreSumsByPlayerForSession(int $sessionId): array
    {
        /** @var list<array{playerId: int|string, totalScore: int|string}> $results */
        $results = $this->createQueryBuilder('se')
            ->select('IDENTITY(se.player) AS playerId', 'SUM(se.score) AS totalScore')
            ->join('se.game', 'g')
            ->andWhere('g.session = :session')
            ->andWhere('g.status = :status')
            ->setParameter('session', $sessionId)
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('se.player')
            ->orderBy('totalScore', 'ASC')
            ->getQuery()
            ->getResult();

        return array_map(static fn (array $row) => [
            'playerId' => (int) $row['playerId'],
            'totalScore' => (int) $row['totalScore'],
        ], $results);
    }

    /**
     * @return list<array{gameId: int, partnerId: int|null, takerId: int, takerScore: int}>
     */
    public function getGamesWithTakerScoreForPlayer(Player $player): array
    {
        /** @var list<array{gameId: int|string, partnerId: int|string|null, takerId: int|string, takerScore: int|string}> $results */
        $results = $this->createQueryBuilder('se')
            ->select('g.id AS gameId', 'IDENTITY(g.taker) AS takerId', 'IDENTITY(g.partner) AS partnerId', 'se2.score AS takerScore')
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

        return array_map(static fn (array $row) => [
            'gameId' => (int) $row['gameId'],
            'partnerId' => null !== $row['partnerId'] ? (int) $row['partnerId'] : null,
            'takerId' => (int) $row['takerId'],
            'takerScore' => (int) $row['takerScore'],
        ], $results);
    }

    /**
     * @return list<array{playerColor: string|null, playerId: int|string, playerName: string, totalScore: int|string}>
     */
    public function getLeaderboardScores(?int $playerGroupId = null): array
    {
        $qb = $this->createQueryBuilder('se')
            ->select('IDENTITY(se.player) AS playerId', 'p.name AS playerName', 'p.color AS playerColor', 'SUM(se.score) AS totalScore')
            ->join('se.player', 'p')
            ->leftJoin('se.game', 'g')
            ->groupBy('se.player')
            ->addGroupBy('p.color')
            ->addGroupBy('p.name')
            ->orderBy('totalScore', 'DESC');

        if (null !== $playerGroupId) {
            $qb->leftJoin('App\Entity\Session', 's_grp', 'WITH', 'se.session = s_grp')
               ->andWhere('(g IS NOT NULL AND g.status = :status AND s_grp.playerGroup = :group) OR (se.game IS NULL AND s_grp.playerGroup = :group)')
               ->setParameter('status', GameStatus::Completed)
               ->setParameter('group', $playerGroupId);
        } else {
            $qb->andWhere('(g IS NOT NULL AND g.status = :status) OR se.game IS NULL')
               ->setParameter('status', GameStatus::Completed);
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * @return list<array{gamesPlayed: int|string, playerId: int|string}>
     */
    public function countGamesPlayedByPlayer(?int $playerGroupId = null): array
    {
        $qb = $this->createQueryBuilder('se')
            ->select('IDENTITY(se.player) AS playerId', 'COUNT(DISTINCT se.game) AS gamesPlayed')
            ->join('se.game', 'g')
            ->andWhere('g.status = :status')
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('se.player');

        if (null !== $playerGroupId) {
            $qb->join('g.session', 's_grp')
               ->andWhere('s_grp.playerGroup = :group')
               ->setParameter('group', $playerGroupId);
        }

        return $qb->getQuery()->getResult();
    }
}
