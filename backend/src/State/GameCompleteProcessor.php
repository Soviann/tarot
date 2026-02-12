<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Doctrine\Common\State\PersistProcessor;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\EloHistory;
use App\Entity\Game;
use App\Enum\GameStatus;
use App\Service\EloCalculator;
use App\Service\ScoreCalculator;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Détecte le passage à Completed → appelle ScoreCalculator + EloCalculator, gère aussi l'édition.
 *
 * @implements ProcessorInterface<Game, Game>
 */
final readonly class GameCompleteProcessor implements ProcessorInterface
{
    public function __construct(
        private EloCalculator $eloCalculator,
        private EntityManagerInterface $em,
        private PersistProcessor $persistProcessor,
        private ScoreCalculator $scoreCalculator,
    ) {
    }

    /**
     * @param Game $data
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Game
    {
        if (GameStatus::Completed === $data->getStatus()) {
            $wasAlreadyCompleted = !$data->getScoreEntries()->isEmpty();

            if ($wasAlreadyCompleted) {
                EloRevertHelper::revert($data, $this->em);
            }

            $this->computeScores($data);
            $this->computeEloRatings($data);

            if (!$wasAlreadyCompleted) {
                $data->setCompletedAt(new \DateTimeImmutable());
                $data->getSession()->advanceDealer();
            }
        }

        return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
    }

    private function computeEloRatings(Game $game): void
    {
        $players = $game->getSession()->getPlayers()->toArray();

        $ratings = [];
        foreach ($players as $player) {
            $ratings[$player->getName()] = $player->getEloRating();
        }

        $results = $this->eloCalculator->compute($game, $ratings);

        $playersByName = [];
        foreach ($players as $player) {
            $playersByName[$player->getName()] = $player;
        }

        foreach ($results as $result) {
            $player = $playersByName[$result['playerName']];
            $player->setEloRating($result['ratingAfter']);

            $history = new EloHistory();
            $history->setGame($game);
            $history->setPlayer($player);
            $history->setRatingAfter($result['ratingAfter']);
            $history->setRatingBefore($result['ratingBefore']);
            $history->setRatingChange($result['ratingChange']);
            $this->em->persist($history);
        }
    }

    private function computeScores(Game $game): void
    {
        // Supprimer les scores existants si édition
        foreach ($game->getScoreEntries()->toArray() as $entry) {
            $game->removeScoreEntry($entry);
            $this->em->remove($entry);
        }

        // Calculer les nouveaux scores
        foreach ($this->scoreCalculator->compute($game) as $entry) {
            $game->addScoreEntry($entry);
        }
    }
}
