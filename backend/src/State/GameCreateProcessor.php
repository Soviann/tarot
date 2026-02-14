<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Doctrine\Common\State\PersistProcessor;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Game;
use App\Enum\GameStatus;
use App\Repository\GameRepository;
use App\Repository\SessionRepository;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

/**
 * Crée une donne sous une session : attribue la position et vérifie qu'aucune donne n'est en cours.
 *
 * @implements ProcessorInterface<Game, Game>
 */
final readonly class GameCreateProcessor implements ProcessorInterface
{
    public function __construct(
        private GameRepository $gameRepository,
        private PersistProcessor $persistProcessor,
        private SessionRepository $sessionRepository,
    ) {
    }

    /**
     * @param Game $data
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Game
    {
        $session = $this->sessionRepository->find($uriVariables['sessionId']);

        if (null === $session) { // @phpstan-ignore identical.alwaysFalse
            throw new UnprocessableEntityHttpException('Session introuvable.');
        }

        if (!$session->getIsActive()) {
            throw new UnprocessableEntityHttpException('La session est clôturée. Aucune nouvelle donne ne peut être créée.');
        }

        // Vérifier qu'aucune donne n'est en cours
        $inProgress = $this->gameRepository->countBySessionAndStatus($session, GameStatus::InProgress);

        if ($inProgress > 0) {
            throw new UnprocessableEntityHttpException('Une donne est déjà en cours pour cette session.');
        }

        // Position auto-incrémentée
        $maxPosition = $this->gameRepository->getMaxPositionForSession($session);

        $data->setDealer($session->getCurrentDealer());
        $data->setPosition($maxPosition + 1);
        $data->setSession($session);
        $data->setStatus(GameStatus::InProgress);

        return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
    }
}
