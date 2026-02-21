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

        /** @var list<array{cnt: string, playerId: int|string}> $rows */
        $rows = $this->createQueryBuilder('se')
            ->select('IDENTITY(se.player) AS playerId, COUNT(se.id) AS cnt')
            ->andWhere('se.player IN (:playerIds)')
            ->setParameter('playerIds', $playerIds)
            ->groupBy('se.player')
            ->getQuery()
            ->getResult();

        $result = \array_fill_keys($playerIds, 0);

        foreach ($rows as $row) {
            $result[(int) $row['playerId']] = (int) $row['cnt'];
        }

        return $result;
    }

    /**
     * @param list<int> $playerIds
     *
     * @return array<int, bool> playerId => has star shower (3 stars within 2 hours)
     */
    public function hasStarShowerForPlayers(array $playerIds): array
    {
        if ([] === $playerIds) {
            return [];
        }

        $conn = $this->getEntityManager()->getConnection();

        $sql = <<<'SQL'
            SELECT DISTINCT se1.player_id
            FROM star_event se1
            INNER JOIN star_event se2 ON se1.player_id = se2.player_id
                AND se1.id != se2.id
                AND se2.created_at >= se1.created_at
                AND TIMESTAMPDIFF(SECOND, se1.created_at, se2.created_at) <= 7200
            WHERE se1.player_id IN (:playerIds)
            GROUP BY se1.player_id, se1.id
            HAVING COUNT(DISTINCT se2.id) >= 2
            SQL;

        /** @var list<array{player_id: int|string}> $results */
        $results = $conn->executeQuery($sql, ['playerIds' => $playerIds], ['playerIds' => \Doctrine\DBAL\ArrayParameterType::INTEGER])->fetchAllAssociative();

        $map = \array_fill_keys($playerIds, false);
        foreach ($results as $row) {
            $map[(int) $row['player_id']] = true;
        }

        return $map;
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

    public function countSessionsWithStarsForPlayer(Player $player, ?int $playerGroupId = null): int
    {
        $qb = $this->createQueryBuilder('se')
            ->select('COUNT(DISTINCT IDENTITY(se.session))')
            ->andWhere('se.player = :player')
            ->setParameter('player', $player);

        if (null !== $playerGroupId) {
            $qb->join('App\Entity\Session', 's_grp', 'WITH', 'se.session = s_grp')
               ->andWhere('s_grp.playerGroup = :group')
               ->setParameter('group', $playerGroupId);
        }

        return (int) $qb->getQuery()->getSingleScalarResult();
    }

    public function getMaxStarsInSessionForPlayer(Player $player, ?int $playerGroupId = null): int
    {
        $qb = $this->createQueryBuilder('se')
            ->select('COUNT(se.id) AS cnt')
            ->andWhere('se.player = :player')
            ->setParameter('player', $player)
            ->groupBy('se.session')
            ->orderBy('cnt', 'DESC')
            ->setMaxResults(1);

        if (null !== $playerGroupId) {
            $qb->join('App\Entity\Session', 's_grp', 'WITH', 'se.session = s_grp')
               ->andWhere('s_grp.playerGroup = :group')
               ->setParameter('group', $playerGroupId);
        }

        /** @var array{cnt: string}|null $result */
        $result = $qb->getQuery()->getOneOrNullResult();

        return null !== $result ? (int) $result['cnt'] : 0;
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
