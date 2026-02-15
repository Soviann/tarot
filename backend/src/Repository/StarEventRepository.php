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

    public function countBySession(Session $session): int
    {
        return (int) $this->createQueryBuilder('se')
            ->select('COUNT(se.id)')
            ->andWhere('se.session = :session')
            ->setParameter('session', $session)
            ->getQuery()
            ->getSingleScalarResult();
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

    public function countByPlayer(Player $player): int
    {
        return (int) $this->createQueryBuilder('se')
            ->select('COUNT(se.id)')
            ->andWhere('se.player = :player')
            ->setParameter('player', $player)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * @param list<int> $playerIds
     *
     * @return array<int, int> playerId => star event count
     */
    public function countByPlayers(array $playerIds): array
    {
        if ([] === $playerIds) {
            return [];
        }

        /** @var list<array{cnt: string, playerId: int}> $rows */
        $rows = $this->createQueryBuilder('se')
            ->select('IDENTITY(se.player) AS playerId, COUNT(se.id) AS cnt')
            ->andWhere('se.player IN (:playerIds)')
            ->setParameter('playerIds', $playerIds)
            ->groupBy('se.player')
            ->getQuery()
            ->getResult();

        $result = array_fill_keys($playerIds, 0);

        foreach ($rows as $row) {
            $result[(int) $row['playerId']] = (int) $row['cnt'];
        }

        return $result;
    }

    public function countByPlayerFiltered(Player $player, ?int $playerGroupId = null): int
    {
        $qb = $this->createQueryBuilder('se')
            ->select('COUNT(se.id)')
            ->andWhere('se.player = :player')
            ->setParameter('player', $player);

        if (null !== $playerGroupId) {
            $qb->join('App\Entity\Session', 's_grp', 'WITH', 'se.session = s_grp')
               ->andWhere('s_grp.playerGroup = :group')
               ->setParameter('group', $playerGroupId);
        }

        return (int) $qb->getQuery()->getSingleScalarResult();
    }

    public function countAll(?int $playerGroupId = null): int
    {
        $qb = $this->createQueryBuilder('se')
            ->select('COUNT(se.id)');

        if (null !== $playerGroupId) {
            $qb->join('App\Entity\Session', 's_grp', 'WITH', 'se.session = s_grp')
               ->andWhere('s_grp.playerGroup = :group')
               ->setParameter('group', $playerGroupId);
        }

        return (int) $qb->getQuery()->getSingleScalarResult();
    }
}
