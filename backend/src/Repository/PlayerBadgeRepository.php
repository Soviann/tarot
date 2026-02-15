<?php

declare(strict_types=1);

namespace App\Repository;

use App\Dto\PlayerBadgeUnlockDto;
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

        return \array_map(static fn (array $row): BadgeType => $row['badgeType'], $results);
    }

    /**
     * @param list<int> $playerIds
     *
     * @return array<int, list<BadgeType>> playerId => badge types
     */
    public function getExistingBadgeTypesForPlayers(array $playerIds): array
    {
        if ([] === $playerIds) {
            return [];
        }

        /** @var list<array{badgeType: BadgeType, playerId: int}> $results */
        $results = $this->createQueryBuilder('pb')
            ->select('IDENTITY(pb.player) AS playerId, pb.badgeType')
            ->andWhere('pb.player IN (:playerIds)')
            ->setParameter('playerIds', $playerIds)
            ->getQuery()
            ->getResult();

        $map = \array_fill_keys($playerIds, []);

        foreach ($results as $row) {
            $map[$row['playerId']][] = $row['badgeType'];
        }

        return $map;
    }

    /**
     * @return list<PlayerBadgeUnlockDto>
     */
    public function getPlayerBadgesWithUnlockDate(Player $player): array
    {
        /** @var list<PlayerBadgeUnlockDto> */
        return $this->createQueryBuilder('pb')
            ->select('NEW App\Dto\PlayerBadgeUnlockDto(pb.badgeType, pb.unlockedAt)')
            ->andWhere('pb.player = :player')
            ->setParameter('player', $player)
            ->orderBy('pb.unlockedAt', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
