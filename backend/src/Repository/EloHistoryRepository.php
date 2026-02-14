<?php

declare(strict_types=1);

namespace App\Repository;

use App\Dto\EloHistoryPointDto;
use App\Dto\EloRankingEntryDto;
use App\Dto\PlayerEloHistoryPointDto;
use App\Entity\EloHistory;
use App\Entity\Game;
use App\Entity\Player;
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
     * @return list<EloHistoryPointDto>
     */
    public function getAllPlayersHistory(?int $playerGroupId = null): array
    {
        $qb = $this->createQueryBuilder('eh')
            ->select('NEW App\Dto\EloHistoryPointDto(eh.createdAt, IDENTITY(eh.game), p.color, IDENTITY(eh.player), p.name, eh.ratingAfter)')
            ->join('eh.player', 'p')
            ->orderBy('eh.id', 'ASC');

        $this->applyGroupFilter($qb, $playerGroupId);

        /** @var list<EloHistoryPointDto> */
        return $qb->getQuery()->getResult();
    }

    /**
     * @return list<EloRankingEntryDto>
     */
    public function getEloRanking(?int $playerGroupId = null): array
    {
        $qb = $this->createQueryBuilder('eh')
            ->select('NEW App\Dto\EloRankingEntryDto(p.eloRating, COUNT(DISTINCT eh.game), p.color, IDENTITY(eh.player), p.name)')
            ->join('eh.player', 'p')
            ->groupBy('eh.player')
            ->addGroupBy('p.color')
            ->addGroupBy('p.name')
            ->addGroupBy('p.eloRating')
            ->orderBy('p.eloRating', 'DESC');

        $this->applyGroupFilter($qb, $playerGroupId);

        /** @var list<EloRankingEntryDto> */
        return $qb->getQuery()->getResult();
    }

    /**
     * @return list<PlayerEloHistoryPointDto>
     */
    public function getPlayerHistory(Player $player, ?int $playerGroupId = null): array
    {
        $qb = $this->createQueryBuilder('eh')
            ->select('NEW App\Dto\PlayerEloHistoryPointDto(eh.createdAt, IDENTITY(eh.game), eh.ratingAfter, eh.ratingChange)')
            ->andWhere('eh.player = :player')
            ->setParameter('player', $player)
            ->orderBy('eh.id', 'ASC');

        $this->applyGroupFilter($qb, $playerGroupId);

        /** @var list<PlayerEloHistoryPointDto> */
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
