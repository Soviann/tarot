<?php

declare(strict_types=1);

namespace App\Controller;

use App\Repository\PlayerGroupRepository;
use App\Repository\SessionRepository;
use App\Service\SessionSummaryService;
use Doctrine\ORM\Exception\ORMException;
use Doctrine\ORM\OptimisticLockException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;

readonly class SessionController
{
    public function __construct(
        private PlayerGroupRepository $playerGroupRepository,
        private SessionRepository $sessionRepository,
    ) {
    }

    /**
     * @throws OptimisticLockException
     * @throws ORMException
     */
    #[Route('/api/player-groups/{id}/close-sessions', methods: ['POST'])]
    public function closeGroupSessions(int $id, SessionRepository $sessionRepository): JsonResponse
    {
        $group = $this->playerGroupRepository->find($id);
        if (null === $group) {
            throw new NotFoundHttpException('Groupe introuvable.');
        }

        return new JsonResponse(['closedCount' => $sessionRepository->closeActiveSessionsForGroup($group)]);
    }

    /**
     * @throws OptimisticLockException
     * @throws ORMException
     */
    #[Route('/api/sessions/{id}/summary', methods: ['GET'])]
    public function summary(int $id, SessionSummaryService $sessionSummaryService): JsonResponse
    {
        $session = $this->sessionRepository->find($id);
        if (null === $session) {
            throw new NotFoundHttpException('Session introuvable.');
        }

        return new JsonResponse($sessionSummaryService->getSummary($session));
    }
}
