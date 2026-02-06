<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Doctrine\Common\State\PersistProcessor;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Game;
use App\Enum\GameStatus;
use App\Service\ScoreCalculator;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Détecte le passage à Completed → appelle ScoreCalculator, gère aussi l'édition.
 *
 * @implements ProcessorInterface<Game, Game>
 */
final readonly class GameCompleteProcessor implements ProcessorInterface
{
    public function __construct(
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
            $this->computeScores($data);
        }

        return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
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
