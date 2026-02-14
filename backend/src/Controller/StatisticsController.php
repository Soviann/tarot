<?php

declare(strict_types=1);

namespace App\Controller;

use App\Repository\PlayerRepository;
use App\Service\BadgeChecker;
use App\Service\GlobalStatisticsService;
use App\Service\PlayerStatisticsService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;

readonly class StatisticsController
{
    public function __construct(
        private PlayerRepository $playerRepository,
    ) {
    }

    #[Route('/api/statistics', methods: ['GET'])]
    public function global(Request $request, GlobalStatisticsService $globalStatisticsService): JsonResponse
    {
        $playerGroupId = $request->query->has('playerGroup')
            ? (int) $request->query->get('playerGroup')
            : null;

        return new JsonResponse([
            'averageGameDuration' => $globalStatisticsService->getAverageGameDurationSeconds($playerGroupId),
            'contractDistribution' => $globalStatisticsService->getContractDistribution($playerGroupId),
            'contractSuccessRateByPlayer' => $globalStatisticsService->getContractSuccessRateByPlayer($playerGroupId),
            'eloEvolution' => $globalStatisticsService->getAllPlayersEloHistory($playerGroupId),
            'eloRanking' => $globalStatisticsService->getEloRanking($playerGroupId),
            'leaderboard' => $globalStatisticsService->getLeaderboard($playerGroupId),
            'totalGames' => $globalStatisticsService->getTotalGames($playerGroupId),
            'totalPlayTime' => $globalStatisticsService->getTotalPlayTimeSeconds($playerGroupId),
            'totalSessions' => $globalStatisticsService->getTotalSessions($playerGroupId),
            'totalStars' => $globalStatisticsService->getTotalStars($playerGroupId),
        ]);
    }

    #[Route('/api/statistics/players/{id}', methods: ['GET'])]
    public function player(int $id, Request $request, BadgeChecker $badgeChecker, PlayerStatisticsService $playerStatisticsService): JsonResponse
    {
        $player = $this->playerRepository->find($id);
        if (null === $player) {
            throw new NotFoundHttpException('Joueur introuvable.');
        }

        $badgeChecker->checkAndAwardForPlayer($player);

        $playerGroupId = $request->query->has('playerGroup')
            ? (int) $request->query->get('playerGroup')
            : null;

        return new JsonResponse($playerStatisticsService->getPlayerStats($player, $playerGroupId));
    }
}
