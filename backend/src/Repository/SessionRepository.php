<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Player;
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
        return $this->createQueryBuilder('s')
            ->addSelect('COALESCE(MAX(g.createdAt), s.createdAt) AS HIDDEN lastActivity')
            ->leftJoin('s.games', 'g')
            ->groupBy('s')
            ->orderBy('lastActivity', 'DESC')
            ->setMaxResults($maxResults)
            ->getQuery()
            ->getResult();
    }

    public function countDistinctCoPlayersForPlayer(Player $player): int
    {
        return (int) $this->createQueryBuilder('s')
            ->select('COUNT(DISTINCT p2.id)')
            ->join('s.players', 'p')
            ->join('s.players', 'p2')
            ->join('s.games', 'g')
            ->andWhere('p = :player')
            ->andWhere('p2 != :player')
            ->andWhere('g.status = :status')
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function countAll(?int $playerGroupId = null): int
    {
        $qb = $this->createQueryBuilder('s')
            ->select('COUNT(s.id)');

        if (null !== $playerGroupId) {
            $qb->andWhere('s.playerGroup = :group')
               ->setParameter('group', $playerGroupId);
        }

        return (int) $qb->getQuery()->getSingleScalarResult();
    }
}
