<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\EloHistory;
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
}
