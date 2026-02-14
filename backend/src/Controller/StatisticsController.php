<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Player;
use App\Service\StatisticsService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
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
    public function global(Request $request): JsonResponse
    {
        $playerGroupId = $request->query->has('playerGroup')
            ? (int) $request->query->get('playerGroup')
            : null;

        return new JsonResponse([
            'averageGameDuration' => $this->statisticsService->getAverageGameDurationSeconds($playerGroupId),
            'contractDistribution' => $this->statisticsService->getContractDistribution($playerGroupId),
            'eloEvolution' => $this->statisticsService->getAllPlayersEloHistory($playerGroupId),
            'eloRanking' => $this->statisticsService->getEloRanking($playerGroupId),
            'leaderboard' => $this->statisticsService->getLeaderboard($playerGroupId),
            'totalGames' => $this->statisticsService->getTotalGames($playerGroupId),
            'totalPlayTime' => $this->statisticsService->getTotalPlayTimeSeconds($playerGroupId),
            'totalSessions' => $this->statisticsService->getTotalSessions($playerGroupId),
            'totalStars' => $this->statisticsService->getTotalStars($playerGroupId),
        ]);
    }

    #[Route('/api/statistics/players/{id}', methods: ['GET'])]
    public function player(int $id, Request $request): JsonResponse
    {
        $player = $this->em->find(Player::class, $id);
        if (null === $player) {
            throw new NotFoundHttpException('Joueur introuvable.');
        }

        $playerGroupId = $request->query->has('playerGroup')
            ? (int) $request->query->get('playerGroup')
            : null;

        return new JsonResponse($this->statisticsService->getPlayerStats($player, $playerGroupId));
    }
}
