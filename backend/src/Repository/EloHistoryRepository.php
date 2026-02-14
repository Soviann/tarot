<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\EloHistory;
use App\Entity\Game;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<EloHistory>
 */
final class EloHistoryRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, EloHistory::class);
    }

    /**
     * @return list<EloHistory>
     */
    public function findByGame(Game $game): array
    {
        return $this->findBy(['game' => $game]);
    }
}
