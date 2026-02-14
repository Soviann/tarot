<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Player;
use App\Entity\Session;
use App\Entity\StarEvent;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<StarEvent>
 */
final class StarEventRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, StarEvent::class);
    }

    public function countBySessionAndPlayer(Session $session, Player $player): int
    {
        return (int) $this->createQueryBuilder('se')
            ->select('COUNT(se.id)')
            ->andWhere('se.session = :session')
            ->andWhere('se.player = :player')
            ->setParameter('player', $player)
            ->setParameter('session', $session)
            ->getQuery()
            ->getSingleScalarResult();
    }
}
