<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Game;
use App\Entity\Session;
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

    public function findInProgressForSession(Session $session): ?Game
    {
        return $this->findOneBy([
            'session' => $session,
            'status' => GameStatus::InProgress,
        ]);
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
