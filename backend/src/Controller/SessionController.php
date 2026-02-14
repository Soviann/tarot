<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\PlayerGroup;
use App\Entity\Session;
use App\Repository\SessionRepository;
use App\Service\SessionSummaryService;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Exception\ORMException;
use Doctrine\ORM\OptimisticLockException;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;

readonly class SessionController
{
    public function __construct(
        private EntityManagerInterface $em,
    ) {
    }

    /**
     * @throws OptimisticLockException
     * @throws ORMException
     */
    #[Route('/api/player-groups/{id}/close-sessions', methods: ['POST'])]
    public function closeGroupSessions(int $id, SessionRepository $sessionRepository): JsonResponse
    {
        $group = $this->em->find(PlayerGroup::class, $id);
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
        $session = $this->em->find(Session::class, $id);
        if (null === $session) {
            throw new NotFoundHttpException('Session introuvable.');
        }

        return new JsonResponse($sessionSummaryService->getSummary($session));
    }
}
