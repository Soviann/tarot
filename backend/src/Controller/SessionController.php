<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\PlayerGroup;
use App\Entity\Session;
use App\Service\SessionSummaryService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;

class SessionController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly SessionSummaryService $sessionSummaryService,
    ) {
    }

    #[Route('/api/player-groups/{id}/close-sessions', methods: ['POST'])]
    public function closeGroupSessions(int $id): JsonResponse
    {
        $group = $this->em->find(PlayerGroup::class, $id);
        if (null === $group) {
            throw new NotFoundHttpException('Groupe introuvable.');
        }

        $count = $this->em->createQuery(
            'UPDATE App\Entity\Session s SET s.isActive = false WHERE s.playerGroup = :group AND s.isActive = true'
        )
            ->setParameter('group', $group)
            ->execute();

        return new JsonResponse(['closedCount' => $count]);
    }

    #[Route('/api/sessions/{id}/summary', methods: ['GET'])]
    public function summary(int $id): JsonResponse
    {
        $session = $this->em->find(Session::class, $id);
        if (null === $session) {
            throw new NotFoundHttpException('Session introuvable.');
        }

        return new JsonResponse($this->sessionSummaryService->getSummary($session));
    }
}
