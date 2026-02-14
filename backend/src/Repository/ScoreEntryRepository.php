<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ScoreEntry;
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
}
