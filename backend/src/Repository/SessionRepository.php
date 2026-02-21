<?php

declare(strict_types=1);

namespace App\Repository;

use App\Dto\DateRange;
use App\Entity\PlayerGroup;
use App\Entity\Session;
use App\Enum\GameStatus;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Session>
 */
final class SessionRepository extends ServiceEntityRepository
{
    use GroupFilterTrait;

    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Session::class);
    }

    /**
     * Ferme (désactive) toutes les sessions actives du groupe.
     *
     * @return int Nombre de sessions mises à jour
     */
    public function closeActiveSessionsForGroup(PlayerGroup $group): int
    {
        $qb = $this->getEntityManager()->createQueryBuilder();

        /** @var int|string $affected */
        $affected = $qb
            ->update(Session::class, 's')
            ->set('s.isActive', ':inactive')
            ->where('s.playerGroup = :group')
            ->andWhere('s.isActive = :active')
            ->setParameter('inactive', false)
            ->setParameter('group', $group)
            ->setParameter('active', true)
            ->getQuery()
            ->execute();

        return (int) $affected;
    }

    /**
     * @param int[] $playerIds
     */
    public function findActiveWithExactPlayers(array $playerIds, int $count): ?Session
    {
        /** @var Session[] $candidates */
        $candidates = $this->createQueryBuilder('s')
            ->join('s.players', 'p')
            ->andWhere('s.isActive = true')
            ->andWhere('p.id IN (:playerIds)')
            ->setParameter('playerIds', $playerIds)
            ->groupBy('s.id')
            ->having('COUNT(DISTINCT p.id) = :count')
            ->setParameter('count', $count)
            ->getQuery()
            ->getResult();

        foreach ($candidates as $session) {
            if ($session->getPlayers()->count() === $count) {
                return $session;
            }
        }

        return null;
    }

    /**
     * @return Session[]
     */
    public function findRecentWithLastActivity(int $maxResults = 5): array
    {
        /** @var list<array{0: Session, lastActivity: string}> $rows */
        $rows = $this->createQueryBuilder('s')
            ->addSelect('COALESCE(MAX(g.createdAt), s.createdAt) AS lastActivity')
            ->leftJoin('s.games', 'g')
            ->groupBy('s')
            ->orderBy('lastActivity', 'DESC')
            ->setMaxResults($maxResults)
            ->getQuery()
            ->getResult();

        return \array_map(static function (array $row): Session {
            $row[0]->setLastPlayedAt(new \DateTimeImmutable($row['lastActivity']));

            return $row[0];
        }, $rows);
    }

    /**
     * @param list<int> $playerIds
     *
     * @return array<int, int> playerId => distinct co-player count
     */
    public function countDistinctCoPlayersForPlayers(array $playerIds): array
    {
        if ([] === $playerIds) {
            return [];
        }

        /** @var list<array{coPlayerCount: string, playerId: int}> $rows */
        $rows = $this->createQueryBuilder('s')
            ->select('p.id AS playerId, COUNT(DISTINCT p2.id) AS coPlayerCount')
            ->join('s.players', 'p')
            ->join('s.players', 'p2')
            ->join('s.games', 'g')
            ->andWhere('p.id IN (:playerIds)')
            ->andWhere('p2 != p')
            ->andWhere('g.status = :status')
            ->setParameter('playerIds', $playerIds)
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('p.id')
            ->getQuery()
            ->getResult();

        $result = \array_fill_keys($playerIds, 0);

        foreach ($rows as $row) {
            $result[(int) $row['playerId']] = (int) $row['coPlayerCount'];
        }

        return $result;
    }

    public function countAll(?DateRange $dateRange = null, ?int $playerGroupId = null): int
    {
        $qb = $this->createQueryBuilder('s')
            ->select('COUNT(s.id)');

        $this->applyDateFilter($qb, $dateRange, 's', 'createdAt');

        if (null !== $playerGroupId) {
            $qb->andWhere('s.playerGroup = :group')
               ->setParameter('group', $playerGroupId);
        }

        return (int) $qb->getQuery()->getSingleScalarResult();
    }
}
