<?php

declare(strict_types=1);

namespace App\Repository;

use Doctrine\ORM\QueryBuilder;

trait GroupFilterTrait
{
    private function applyGroupFilter(QueryBuilder $qb, ?int $playerGroupId, string $gameAlias = 'g'): void
    {
        if (null !== $playerGroupId) {
            $qb->join($gameAlias.'.session', 's_grp')
               ->andWhere('s_grp.playerGroup = :group')
               ->setParameter('group', $playerGroupId);
        }
    }
}
