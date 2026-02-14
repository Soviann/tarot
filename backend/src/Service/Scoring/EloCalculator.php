<?php

declare(strict_types=1);

namespace App\Service\Scoring;

use App\Entity\Game;

class EloCalculator
{
    private const int K_DEFENDER = 15;
    private const int K_PARTNER = 25;
    private const int K_TAKER = 40;

    /**
     * Calcule les variations ELO pour chaque joueur d'une donne.
     *
     * @param array<string, int> $ratings ELO actuel de chaque joueur indexé par nom
     *
     * @return list<array{playerId: int|null, playerName: string, ratingAfter: int, ratingBefore: int, ratingChange: int}>
     */
    public function compute(Game $game, array $ratings): array
    {
        $taker = $game->getTaker();
        $partner = $game->getPartner();
        $selfCall = null === $partner;

        // Déterminer si l'attaque gagne : score du preneur > 0
        $attackWins = false;
        foreach ($game->getScoreEntries() as $entry) {
            if ($entry->getPlayer() === $taker) {
                $attackWins = $entry->getScore() > 0;
                break;
            }
        }

        $players = $game->getSession()->getPlayers()->toArray();

        // Séparer attaquants et défenseurs
        $attackerNames = [$taker->getName()];
        if (!$selfCall) {
            $attackerNames[] = $partner->getName();
        }

        $defenderNames = [];
        foreach ($players as $player) {
            if (!\in_array($player->getName(), $attackerNames, true)) {
                $defenderNames[] = $player->getName();
            }
        }

        // Calculer les ELO moyens de chaque camp
        $avgAttackElo = $this->average($ratings, $attackerNames);
        $avgDefenseElo = $this->average($ratings, $defenderNames);

        $result = [];
        foreach ($players as $player) {
            $name = $player->getName();
            $ratingBefore = $ratings[$name];
            $isTaker = $name === $taker->getName();
            $isPartner = !$selfCall && $name === $partner->getName();

            if ($isTaker || $isPartner) {
                // Attaquant vs moyenne défense
                $k = $isTaker ? self::K_TAKER : self::K_PARTNER;
                $expected = $this->expectedScore($ratingBefore, $avgDefenseElo);
                $actual = $attackWins ? 1.0 : 0.0;
            } else {
                // Défenseur vs moyenne attaque
                $k = self::K_DEFENDER;
                $expected = $this->expectedScore($ratingBefore, $avgAttackElo);
                $actual = $attackWins ? 0.0 : 1.0;
            }

            $change = (int) \round($k * ($actual - $expected));

            $result[] = [
                'playerId' => $player->getId(),
                'playerName' => $name,
                'ratingAfter' => $ratingBefore + $change,
                'ratingBefore' => $ratingBefore,
                'ratingChange' => $change,
            ];
        }

        return $result;
    }

    /**
     * @param array<string, int> $ratings
     * @param list<string>       $names
     */
    private function average(array $ratings, array $names): float
    {
        $sum = 0;
        foreach ($names as $name) {
            $sum += $ratings[$name];
        }

        return $sum / \count($names);
    }

    private function expectedScore(int $playerElo, float $opponentElo): float
    {
        return 1.0 / (1.0 + 10 ** (($opponentElo - $playerElo) / 400));
    }
}
