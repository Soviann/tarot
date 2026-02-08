<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Player;
use App\Service\StatisticsService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;

class StatisticsController
{
    public function __construct(
        private readonly EntityManagerInterface $em,
        private readonly StatisticsService $statisticsService,
    ) {
    }

    #[Route('/api/statistics', methods: ['GET'])]
    public function global(): JsonResponse
    {
        return new JsonResponse([
            'contractDistribution' => $this->statisticsService->getContractDistribution(),
            'leaderboard' => $this->statisticsService->getLeaderboard(),
            'totalGames' => $this->statisticsService->getTotalGames(),
            'totalSessions' => $this->statisticsService->getTotalSessions(),
            'totalStars' => $this->statisticsService->getTotalStars(),
        ]);
    }

    #[Route('/api/statistics/players/{id}', methods: ['GET'])]
    public function player(int $id): JsonResponse
    {
        $player = $this->em->find(Player::class, $id);
        if (null === $player) {
            throw new NotFoundHttpException('Joueur introuvable.');
        }

        return new JsonResponse($this->statisticsService->getPlayerStats($player));
    }
}
