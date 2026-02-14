<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\PlayerGroup;
use App\Entity\Session;
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
}
