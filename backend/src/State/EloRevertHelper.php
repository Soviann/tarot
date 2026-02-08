<?php

declare(strict_types=1);

namespace App\State;

use App\Entity\EloHistory;
use App\Entity\Game;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Restaure les ELO des joueurs à l'état précédent une donne, et supprime les EloHistory associées.
 */
final class EloRevertHelper
{
    public static function revert(Game $game, EntityManagerInterface $em): void
    {
        /** @var list<EloHistory> $histories */
        $histories = $em->getRepository(EloHistory::class)->findBy(['game' => $game]);

        foreach ($histories as $history) {
            $history->getPlayer()->setEloRating($history->getRatingBefore());
            $em->remove($history);
        }
    }
}
