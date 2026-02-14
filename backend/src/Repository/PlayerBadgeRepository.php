<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Player;
use App\Entity\PlayerBadge;
use App\Enum\BadgeType;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<PlayerBadge>
 */
final class PlayerBadgeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, PlayerBadge::class);
    }

    /**
     * @return list<BadgeType>
     */
    public function getExistingBadgeTypesForPlayer(Player $player): array
    {
        /** @var list<array{badgeType: BadgeType}> $results */
        $results = $this->createQueryBuilder('pb')
            ->select('pb.badgeType')
            ->andWhere('pb.player = :player')
            ->setParameter('player', $player)
            ->getQuery()
            ->getResult();

        return array_map(static fn (array $row): BadgeType => $row['badgeType'], $results);
    }
}
