<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Game;
use App\Entity\Player;
use App\Entity\Session;
use App\Enum\Chelem;
use App\Enum\Contract;
use App\Enum\GameStatus;
use App\Enum\Side;
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

    public function countByTakerAndStatusAndChelem(Player $player, Chelem $chelem): int
    {
        return (int) $this->createQueryBuilder('g')
            ->select('COUNT(g.id)')
            ->andWhere('g.taker = :player')
            ->andWhere('g.status = :status')
            ->andWhere('g.chelem = :chelem')
            ->setParameter('chelem', $chelem)
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function countByTakerAndStatusAndContract(Player $player, Contract $contract): int
    {
        return (int) $this->createQueryBuilder('g')
            ->select('COUNT(g.id)')
            ->andWhere('g.taker = :player')
            ->andWhere('g.status = :status')
            ->andWhere('g.contract = :contract')
            ->setParameter('contract', $contract)
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function countWonGamesWithContract(Player $player, Contract $contract): int
    {
        return (int) $this->createQueryBuilder('g')
            ->select('COUNT(g.id)')
            ->join('g.scoreEntries', 'se')
            ->andWhere('g.taker = :player')
            ->andWhere('g.status = :status')
            ->andWhere('g.contract = :contract')
            ->andWhere('se.player = :player')
            ->andWhere('se.score > 0')
            ->setParameter('contract', $contract)
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function countWonGamesWithPetitAuBout(Player $player, Side $side): int
    {
        return (int) $this->createQueryBuilder('g')
            ->select('COUNT(g.id)')
            ->join('g.scoreEntries', 'se')
            ->andWhere('g.taker = :player')
            ->andWhere('g.status = :status')
            ->andWhere('g.petitAuBout = :petitAuBout')
            ->andWhere('se.player = :player')
            ->andWhere('se.score > 0')
            ->setParameter('petitAuBout', $side)
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * @return list<int>
     */
    public function getMarathonSessionsForPlayer(Player $player, int $thresholdSeconds): array
    {
        /** @var list<array{sessionId: int|string}> $results */
        $results = $this->createQueryBuilder('g')
            ->select('IDENTITY(g.session) AS sessionId')
            ->join('g.session', 's')
            ->join('s.players', 'p')
            ->andWhere('p = :player')
            ->andWhere('g.status = :status')
            ->andWhere('g.completedAt IS NOT NULL')
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('g.session')
            ->having('MAX(TIMESTAMPDIFF(SECOND, s.createdAt, g.completedAt)) > :threshold')
            ->setParameter('threshold', $thresholdSeconds)
            ->getQuery()
            ->getResult();

        return array_map(static fn (array $row): int => (int) $row['sessionId'], $results);
    }

    /**
     * @return list<int>
     */
    public function getTakerScoresForPlayer(Player $player): array
    {
        /** @var list<array{score: int|string}> $results */
        $results = $this->createQueryBuilder('g')
            ->select('se.score')
            ->join('g.scoreEntries', 'se')
            ->andWhere('g.taker = :player')
            ->andWhere('g.status = :status')
            ->andWhere('se.player = :player')
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->orderBy('g.createdAt', 'ASC')
            ->getQuery()
            ->getResult();

        return array_map(static fn (array $row): int => (int) $row['score'], $results);
    }
}
