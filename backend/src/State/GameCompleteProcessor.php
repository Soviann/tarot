<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Doctrine\Common\State\PersistProcessor;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Dto\NewBadgesDto;
use App\Entity\EloHistory;
use App\Entity\Game;
use App\Enum\GameStatus;
use App\Service\BadgeChecker;
use App\Service\Scoring\EloCalculator;
use App\Service\Scoring\ScoreCalculator;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Détecte le passage à Completed → appelle ScoreCalculator + EloCalculator, gère aussi l'édition.
 *
 * @implements ProcessorInterface<Game, Game>
 */
final readonly class GameCompleteProcessor implements ProcessorInterface
{
    public function __construct(
        private BadgeChecker $badgeChecker,
        private EloCalculator $eloCalculator,
        private EloRevertHelper $eloRevertHelper,
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
        $wasAlreadyCompleted = false;

        if (GameStatus::Completed === $data->getStatus()) {
            $wasAlreadyCompleted = !$data->getScoreEntries()->isEmpty();

            if ($wasAlreadyCompleted) {
                $this->eloRevertHelper->revert($data);
            }

            $this->computeScores($data);
            $this->computeEloRatings($data);

            if (!$wasAlreadyCompleted) {
                $now = new \DateTimeImmutable();
                $data->setCompletedAt($now);
                $data->getSession()->advanceDealer();

                foreach ($data->getSession()->getPlayers() as $player) {
                    $player->setLastActivityAt($now);
                }
            }
        }

        /** @var Game $game */
        $game = $this->persistProcessor->process($data, $operation, $uriVariables, $context);

        if (GameStatus::Completed === $data->getStatus() && !$wasAlreadyCompleted) {
            $newBadges = $this->badgeChecker->checkAndAward($data->getSession());
            if (!empty($newBadges)) {
                $game->setNewBadges(NewBadgesDto::fromAwardedBadges($newBadges));
            }
        }

        return $game;
    }

    private function computeEloRatings(Game $game): void
    {
        $players = $game->getSession()->getPlayers()->toArray();

        /** @var array<int, int> $ratings */
        $ratings = [];
        $playersById = [];
        foreach ($players as $player) {
            $id = $player->getId();
            \assert(null !== $id);
            $playersById[$id] = $player;
            $ratings[$id] = $player->getEloRating();
        }

        $results = $this->eloCalculator->compute($game, $ratings);

        foreach ($results as $result) {
            $player = $playersById[$result['playerId']];
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
