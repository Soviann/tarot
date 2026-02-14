<?php

declare(strict_types=1);

namespace App\Service\Scoring;

use App\Entity\Game;

/**
 * Calcule une variation d'ELO pour une donne de Tarot.
 * Rappel du principe ELO @link docs/user-guide.md:409.
 *
 * Principe :
 * - On détermine si l'attaque (preneur + éventuellement partenaire) a gagné.
 * - On calcule l'ELO moyen de chaque camp (attaque / défense).
 * - Chaque joueur est ensuite comparé à la moyenne du camp adverse via la formule ELO classique
 *   (score attendu), puis on applique un coefficient K dépendant du rôle.
 *
 * Notes :
 * - Le résultat est symétrique : la somme des variations n'est pas strictement garantie à 0 à cause
 *   des arrondis (round) et des K différents par rôle.
 * - Le tableau $ratings doit contenir une entrée pour chaque joueur de la session, indexée par nom.
 */
class EloCalculator
{
    /** K-factor appliqué à chaque défenseur (variation plus "douce"). */
    private const int K_DEFENDER = 15;

    /** K-factor appliqué au partenaire (variation intermédiaire). */
    private const int K_PARTNER = 25;

    /** K-factor appliqué au preneur (variation la plus forte). */
    private const int K_TAKER = 40;

    /**
     * Calcule les variations ELO pour chaque joueur d'une donne.
     *
     * Le "camp" d'un joueur est déterminé par le preneur et, si présent, son partenaire.
     * Un "appel au roi" absent (partner = null) signifie que le preneur joue seul.
     *
     * Détermination de la victoire :
     * - On se base sur l'entrée de score du preneur : si son score est strictement > 0,
     *   l'attaque est considérée gagnante, sinon perdante.
     *
     * @param Game              $game    donne à évaluer (joueurs, preneur, partenaire, scores)
     * @param array<string,int> $ratings ELO actuel de chaque joueur indexé par nom (doit couvrir tous les joueurs de la session)
     *
     * @return list<array{
     *   playerId: int|null,
     *   playerName: string,
     *   ratingAfter: int,
     *   ratingBefore: int,
     *   ratingChange: int
     * }>
     */
    public function compute(Game $game, array $ratings): array
    {
        $taker = $game->getTaker();
        $partner = $game->getPartner();

        // Si aucun partenaire n'est défini, le preneur joue seul.
        $selfCall = null === $partner;

        // Déterminer si l'attaque gagne via le score du preneur.
        $attackWins = false;
        foreach ($game->getScoreEntries() as $entry) {
            if ($entry->getPlayer() === $taker) {
                $attackWins = $entry->getScore() > 0;
                break;
            }
        }

        $players = $game->getSession()->getPlayers()->toArray();

        // Construire les camps sous forme de listes de noms (les ratings sont indexés par nom).
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

        // ELO "d'équipe" : moyenne de chaque camp.
        $avgAttackElo = $this->average($ratings, $attackerNames);
        $avgDefenseElo = $this->average($ratings, $defenderNames);

        $result = [];
        foreach ($players as $player) {
            $name = $player->getName();
            $ratingBefore = $ratings[$name];

            $isTaker = $name === $taker->getName();
            $isPartner = !$selfCall && $name === $partner->getName();

            if ($isTaker || $isPartner) {
                // Attaquant (preneur/partenaire) comparé à la moyenne de la défense.
                $k = $isTaker ? self::K_TAKER : self::K_PARTNER;
                $expected = $this->expectedScore($ratingBefore, $avgDefenseElo);
                $actual = $attackWins ? 1.0 : 0.0;
            } else {
                // Défenseur comparé à la moyenne de l'attaque.
                $k = self::K_DEFENDER;
                $expected = $this->expectedScore($ratingBefore, $avgAttackElo);
                $actual = $attackWins ? 0.0 : 1.0;
            }

            // Variation ELO : K * (score réel - score attendu), arrondi à l'entier le plus proche.
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
     * Calcule une moyenne ELO sur une liste de joueurs.
     *
     * @param array<string,int> $ratings ratings indexés par nom
     * @param list<string>      $names   noms à inclure dans la moyenne (doivent exister dans $ratings)
     */
    private function average(array $ratings, array $names): float
    {
        $sum = 0;
        foreach ($names as $name) {
            $sum += $ratings[$name];
        }

        return $sum / \count($names);
    }

    /**
     * Score attendu (formule ELO standard).
     *
     * - Renvoie une probabilité entre 0 et 1.
     * - Plus l'ELO du joueur est grand par rapport à l'adversaire, plus le score attendu tend vers 1.
     */
    private function expectedScore(int $playerElo, float $opponentElo): float
    {
        return 1.0 / (1.0 + 10 ** (($opponentElo - $playerElo) / 400));
    }
}
