<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Entity\Session;
use App\Repository\SessionRepository;

/**
 * Fournit la liste des sessions triées par dernière activité décroissante, limitée à 5.
 *
 * @implements ProviderInterface<Session>
 */
final readonly class SessionCollectionProvider implements ProviderInterface
{
    public function __construct(
        private SessionRepository $sessionRepository,
    ) {
    }

    /**
     * @return Session[]
     */
    public function provide(Operation $operation, array $uriVariables = [], array $context = []): array
    {
        return $this->sessionRepository->findRecentWithLastActivity();
    }
}
