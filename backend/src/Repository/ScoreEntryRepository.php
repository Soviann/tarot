<?php

declare(strict_types=1);

namespace App\Repository;

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
}
