<?php

declare(strict_types=1);

namespace App\State;

use App\Entity\Game;
use App\Repository\EloHistoryRepository;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Restaure les ELO des joueurs à l'état précédent une donne, et supprime les EloHistory associées.
 */
final readonly class EloRevertHelper
{
    public function __construct(
        private EloHistoryRepository $eloHistoryRepository,
        private EntityManagerInterface $em,
    ) {
    }

    public function revert(Game $game): void
    {
        $histories = $this->eloHistoryRepository->findByGame($game);

        foreach ($histories as $history) {
            $history->getPlayer()->setEloRating($history->getRatingBefore());
            $this->em->remove($history);
        }
    }
}
