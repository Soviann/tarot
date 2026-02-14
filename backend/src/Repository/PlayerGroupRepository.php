<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\PlayerGroup;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<PlayerGroup>
 */
final class PlayerGroupRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PlayerGroup::class);
    }

    /**
     * @param int[] $playerIds
     *
     * @return list<PlayerGroup>
     */
    public function findMatchingExactPlayers(array $playerIds, int $count): array
    {
        /** @var list<PlayerGroup> $result */
        $result = $this->createQueryBuilder('pg')
            ->join('pg.players', 'p')
            ->andWhere('p.id IN (:playerIds)')
            ->setParameter('playerIds', $playerIds)
            ->groupBy('pg.id')
            ->having('COUNT(DISTINCT p.id) = :count')
            ->setParameter('count', $count)
            ->getQuery()
            ->getResult();

        return $result;
    }
}
