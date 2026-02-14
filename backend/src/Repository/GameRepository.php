<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Game;
use App\Entity\Session;
use App\Enum\Contract;
use App\Enum\GameStatus;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Game>
 */
final class GameRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Game::class);
    }

    public function countBySessionAndStatus(Session $session, GameStatus $status): int
    {
        return (int) $this->createQueryBuilder('g')
            ->select('COUNT(g.id)')
            ->andWhere('g.session = :session')
            ->andWhere('g.status = :status')
            ->setParameter('session', $session)
            ->setParameter('status', $status)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function countCompletedForSession(Session $session): int
    {
        return $this->countBySessionAndStatus($session, GameStatus::Completed);
    }

    /**
     * @return array<int, int> playerId => count
     */
    public function countTakerGamesPerPlayerForSession(Session $session): array
    {
        /** @var list<array{count: int|string, playerId: int|string}> $results */
        $results = $this->createQueryBuilder('g')
            ->select('IDENTITY(g.taker) AS playerId', 'COUNT(g.id) AS count')
            ->andWhere('g.session = :session')
            ->andWhere('g.status = :status')
            ->setParameter('session', $session)
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('g.taker')
            ->getQuery()
            ->getResult();

        $countMap = [];
        foreach ($results as $row) {
            $countMap[(int) $row['playerId']] = (int) $row['count'];
        }

        return $countMap;
    }

    public function findInProgressForSession(Session $session): ?Game
    {
        return $this->findOneBy([
            'session' => $session,
            'status' => GameStatus::InProgress,
        ]);
    }

    /**
     * @return array{contract: string, count: int}|null
     */
    public function findMostPlayedContractForSession(Session $session): ?array
    {
        /** @var list<array{contract: Contract, count: int|string}> $results */
        $results = $this->createQueryBuilder('g')
            ->select('g.contract AS contract', 'COUNT(g.id) AS count')
            ->andWhere('g.session = :session')
            ->andWhere('g.status = :status')
            ->setParameter('session', $session)
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('g.contract')
            ->orderBy('count', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getResult();

        if (empty($results)) {
            return null;
        }

        return [
            'contract' => $results[0]['contract']->value,
            'count' => (int) $results[0]['count'],
        ];
    }

    /**
     * @param list<Contract> $contracts
     *
     * @return array{count: int, playerColor: string|null, playerId: int, playerName: string}|null
     */
    public function getHighContractTakerCountsForSession(Session $session, array $contracts): ?array
    {
        /** @var list<array{count: int|string, playerColor: string|null, playerId: int|string, playerName: string}> $results */
        $results = $this->createQueryBuilder('g')
            ->select('IDENTITY(g.taker) AS playerId', 'p.name AS playerName', 'p.color AS playerColor', 'COUNT(g.id) AS count')
            ->join('g.taker', 'p')
            ->andWhere('g.session = :session')
            ->andWhere('g.status = :status')
            ->andWhere('g.contract IN (:contracts)')
            ->setParameter('session', $session)
            ->setParameter('status', GameStatus::Completed)
            ->setParameter('contracts', $contracts)
            ->groupBy('g.taker')
            ->addGroupBy('p.name')
            ->addGroupBy('p.color')
            ->orderBy('count', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getResult();

        if (empty($results)) {
            return null;
        }

        $row = $results[0];

        return [
            'count' => (int) $row['count'],
            'playerColor' => $row['playerColor'],
            'playerId' => (int) $row['playerId'],
            'playerName' => $row['playerName'],
        ];
    }

    public function getMaxCompletedAtForSession(Session $session): ?string
    {
        /** @var string|null */
        return $this->createQueryBuilder('g')
            ->select('MAX(g.completedAt)')
            ->andWhere('g.session = :session')
            ->andWhere('g.status = :status')
            ->andWhere('g.completedAt IS NOT NULL')
            ->setParameter('session', $session)
            ->setParameter('status', GameStatus::Completed)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function getMaxPositionForSession(Session $session): int
    {
        return (int) $this->createQueryBuilder('g')
            ->select('MAX(g.position)')
            ->andWhere('g.session = :session')
            ->setParameter('session', $session)
            ->getQuery()
            ->getSingleScalarResult();
    }
}
