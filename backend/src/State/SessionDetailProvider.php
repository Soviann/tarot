<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Doctrine\Orm\State\ItemProvider;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Dto\CumulativeScoreDto;
use App\Entity\Session;
use App\Repository\GameRepository;
use App\Repository\ScoreEntryRepository;

/**
 * Enrichit le GET item d'une session avec les scores cumulés par joueur.
 *
 * @implements ProviderInterface<Session>
 */
final readonly class SessionDetailProvider implements ProviderInterface
{
    public function __construct(
        private GameRepository $gameRepository,
        private ItemProvider $itemProvider,
        private ScoreEntryRepository $scoreEntryRepository,
    ) {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): ?Session
    {
        /** @var Session|null $session */
        $session = $this->itemProvider->provide($operation, $uriVariables, $context);

        if (null === $session) {
            return null;
        }

        $session->setCumulativeScores(\array_map(
            static fn (CumulativeScoreDto $dto) => [
                'playerId' => $dto->playerId,
                'playerName' => $dto->playerName,
                'score' => $dto->score,
            ],
            $this->scoreEntryRepository->getCumulativeScoresForSession($session),
        ));
        $session->setInProgressGame($this->gameRepository->findInProgressForSession($session));

        return $session;
    }
}
