<?php

declare(strict_types=1);

namespace App\Repository;

use App\Dto\DateRange;
use Doctrine\ORM\QueryBuilder;

trait GroupFilterTrait
{
    private function applyDateFilter(QueryBuilder $qb, ?DateRange $dateRange, string $alias, string $field): void
    {
        if (null === $dateRange) {
            return;
        }

        if (null !== $dateRange->from) {
            $qb->andWhere($alias.'.'.$field.' >= :dateFrom')
               ->setParameter('dateFrom', $dateRange->from);
        }

        if (null !== $dateRange->to) {
            $qb->andWhere($alias.'.'.$field.' <= :dateTo')
               ->setParameter('dateTo', $dateRange->to);
        }
    }

    private function applyGroupFilter(QueryBuilder $qb, ?int $playerGroupId, string $gameAlias = 'g'): void
    {
        if (null !== $playerGroupId) {
            $qb->join($gameAlias.'.session', 's_grp')
               ->andWhere('s_grp.playerGroup = :group')
               ->setParameter('group', $playerGroupId);
        }
    }

    private function applySessionDateFilter(QueryBuilder $qb, ?DateRange $dateRange, string $entityAlias, string $sessionRelation = 'session'): void
    {
        if (null === $dateRange) {
            return;
        }

        $qb->join('App\Entity\Session', 's_date', 'WITH', $entityAlias.'.'.$sessionRelation.' = s_date');

        if (null !== $dateRange->from) {
            $qb->andWhere('s_date.createdAt >= :dateFrom')
               ->setParameter('dateFrom', $dateRange->from);
        }

        if (null !== $dateRange->to) {
            $qb->andWhere('s_date.createdAt <= :dateTo')
               ->setParameter('dateTo', $dateRange->to);
        }
    }

    private function applySessionGroupFilter(QueryBuilder $qb, ?int $playerGroupId, string $entityAlias, string $sessionRelation = 'session'): void
    {
        if (null !== $playerGroupId) {
            $qb->join('App\Entity\Session', 's_grp', 'WITH', $entityAlias.'.'.$sessionRelation.' = s_grp')
               ->andWhere('s_grp.playerGroup = :group')
               ->setParameter('group', $playerGroupId);
        }
    }
}
