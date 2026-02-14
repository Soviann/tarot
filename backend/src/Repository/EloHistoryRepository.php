<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\EloHistory;
use App\Entity\Game;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<EloHistory>
 */
final class EloHistoryRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, EloHistory::class);
    }

    /**
     * @return list<EloHistory>
     */
    public function findByGame(Game $game): array
    {
        return $this->findBy(['game' => $game]);
    }

    /**
     * @return list<array{date: \DateTimeImmutable, gameId: int|string, playerColor: string|null, playerId: int|string, playerName: string, ratingAfter: int|string}>
     */
    public function getAllPlayersHistory(?int $playerGroupId = null): array
    {
        $qb = $this->createQueryBuilder('eh')
            ->select('IDENTITY(eh.player) AS playerId', 'p.name AS playerName', 'p.color AS playerColor', 'eh.createdAt AS date', 'IDENTITY(eh.game) AS gameId', 'eh.ratingAfter AS ratingAfter')
            ->join('eh.player', 'p')
            ->orderBy('eh.id', 'ASC');

        $this->applyGroupFilter($qb, $playerGroupId);

        return $qb->getQuery()->getResult();
    }

    /**
     * @return list<array{eloRating: int|string, gamesPlayed: int|string, playerColor: string|null, playerId: int|string, playerName: string}>
     */
    public function getEloRanking(?int $playerGroupId = null): array
    {
        $qb = $this->createQueryBuilder('eh')
            ->select('IDENTITY(eh.player) AS playerId', 'p.name AS playerName', 'p.color AS playerColor', 'p.eloRating AS eloRating', 'COUNT(DISTINCT eh.game) AS gamesPlayed')
            ->join('eh.player', 'p')
            ->groupBy('eh.player')
            ->addGroupBy('p.color')
            ->addGroupBy('p.name')
            ->addGroupBy('p.eloRating')
            ->orderBy('eloRating', 'DESC');

        $this->applyGroupFilter($qb, $playerGroupId);

        return $qb->getQuery()->getResult();
    }

    private function applyGroupFilter(\Doctrine\ORM\QueryBuilder $qb, ?int $playerGroupId): void
    {
        if (null !== $playerGroupId) {
            $qb->join('eh.game', 'g_grp')
               ->join('g_grp.session', 's_grp')
               ->andWhere('s_grp.playerGroup = :group')
               ->setParameter('group', $playerGroupId);
        }
    }
}
