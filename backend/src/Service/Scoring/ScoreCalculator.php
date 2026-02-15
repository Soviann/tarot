<?php

declare(strict_types=1);

namespace App\Service\Scoring;

use App\Entity\Game;
use App\Entity\Player;
use App\Entity\ScoreEntry;
use App\Enum\Chelem;
use App\Enum\Contract;
use App\Enum\Poignee;
use App\Enum\Side;

/**
 * Calcule le score de chaque joueur pour une donne de Tarot.
 *
 * Règles officielles appliquées :
 * 1. Score de base = (|points réalisés − points requis| + 25) × multiplicateur du contrat.
 *    Négatif si l'attaque perd.
 * 2. Bonus poignée : toujours attribué au camp gagnant (20 / 30 / 40 selon simple/double/triple).
 * 3. Bonus petit au bout : 10 × multiplicateur, signé selon le camp qui l'a réalisé et le résultat.
 * 4. Bonus chelem : fixe (+400 annoncé réussi, +200 non-annoncé réussi, −200 annoncé raté).
 *
 * Distribution (5 joueurs) :
 * - Preneur seul (pas d'appel au roi) : ×4
 * - Preneur avec partenaire : preneur ×2, partenaire ×1
 * - Défenseurs : −1 × score total chacun
 *
 * @see REQUIRED_POINTS pour la table oudlers → points requis
 */
final readonly class ScoreCalculator
{
    /** Nombre de points requis selon le nombre d'oudlers (0 à 3). */
    public const array REQUIRED_POINTS = [0 => 56, 1 => 51, 2 => 41, 3 => 36];

    /**
     * Calcule les scores de chaque joueur pour une donne donnée.
     *
     * @return ScoreEntry[]
     */
    public function compute(Game $game): array
    {
        $oudlers = $game->getOudlers() ?? throw new \InvalidArgumentException('Le nombre d\'oudlers est requis.');
        $points = $game->getPoints() ?? throw new \InvalidArgumentException('Les points sont requis.');

        $contract = $game->getContract();
        $multiplier = $this->getContractMultiplier($contract);
        $requiredPoints = $this->getRequiredPoints($oudlers);
        $intPoints = (int) $points;
        $attackWins = $intPoints >= $requiredPoints;

        // Score de base : (|points - requis| + 25) × multiplicateur, négatif si perdu
        $baseScore = (\abs($intPoints - $requiredPoints) + 25) * $multiplier;
        if (!$attackWins) {
            $baseScore = -$baseScore;
        }

        // Bonus poignée : toujours au camp gagnant
        $poigneeBonus = $this->getPoigneeBonus($game->getPoignee());
        if (!$attackWins) {
            $poigneeBonus = -$poigneeBonus;
        }

        // Bonus petit au bout : 10 × multiplicateur, signé selon le camp
        $petitAuBoutBonus = $this->computePetitAuBoutBonus($game->getPetitAuBout(), $attackWins, $multiplier);

        // Bonus chelem
        $chelemBonus = $this->computeChelemBonus($game->getChelem());

        $totalScore = $baseScore + $poigneeBonus + $petitAuBoutBonus + $chelemBonus;

        // Distribution selon les rôles
        return $this->distribute($game, $totalScore);
    }

    private function computeChelemBonus(Chelem $chelem): int
    {
        return match ($chelem) {
            Chelem::AnnouncedLost => -200,
            Chelem::AnnouncedWon => 400,
            Chelem::None => 0,
            Chelem::NotAnnouncedWon => 200,
        };
    }

    private function computePetitAuBoutBonus(Side $petitAuBout, bool $attackWins, int $multiplier): int
    {
        if (Side::None === $petitAuBout) {
            return 0;
        }

        $bonus = 10 * $multiplier;
        $playedByAttack = Side::Attack === $petitAuBout;

        // Le bonus est positif pour le camp qui l'a joué SI ce camp gagne.
        // Du point de vue de l'attaque :
        // - Attaque joue + gagne → +bonus
        // - Attaque joue + perd  → -bonus (l'attaque perd son petit)
        // - Défense joue + attaque gagne → -bonus (le bonus va à la défense)
        // - Défense joue + attaque perd  → -bonus (le bonus va à la défense qui gagne)
        if ($playedByAttack && $attackWins) {
            return $bonus;
        }

        return -$bonus;
    }

    /**
     * @return ScoreEntry[]
     */
    private function distribute(Game $game, int $totalScore): array
    {
        $taker = $game->getTaker();
        $partner = $game->getPartner();
        $players = $game->getSession()->getPlayers()->toArray();
        $selfCall = null === $partner;

        $entries = [];
        foreach ($players as $player) {
            /** @var Player $player */
            $entry = new ScoreEntry();
            $entry->setGame($game);
            $entry->setPlayer($player);

            if ($player === $taker) {
                $entry->setScore($totalScore * ($selfCall ? 4 : 2));
            } elseif (!$selfCall && $player === $partner) {
                $entry->setScore($totalScore);
            } else {
                $entry->setScore(-$totalScore);
            }

            $entries[] = $entry;
        }

        return $entries;
    }

    private function getContractMultiplier(Contract $contract): int
    {
        return match ($contract) {
            Contract::Garde => 2,
            Contract::GardeContre => 6,
            Contract::GardeSans => 4,
            Contract::Petite => 1,
        };
    }

    private function getPoigneeBonus(Poignee $poignee): int
    {
        return match ($poignee) {
            Poignee::Double => 30,
            Poignee::None => 0,
            Poignee::Simple => 20,
            Poignee::Triple => 40,
        };
    }

    private function getRequiredPoints(int $oudlers): int
    {
        return self::REQUIRED_POINTS[$oudlers] ?? throw new \InvalidArgumentException(\sprintf('Nombre d\'oudlers invalide : %d', $oudlers));
    }
}
