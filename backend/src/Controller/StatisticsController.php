<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\Player;
use App\Service\BadgeChecker;
use App\Service\GlobalStatisticsService;
use App\Service\PlayerStatisticsService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;

class StatisticsController
{
    public function __construct(
        private readonly BadgeChecker $badgeChecker,
        private readonly EntityManagerInterface $em,
        private readonly GlobalStatisticsService $globalStatisticsService,
        private readonly PlayerStatisticsService $playerStatisticsService,
    ) {
    }

    #[Route('/api/statistics', methods: ['GET'])]
    public function global(Request $request): JsonResponse
    {
        $playerGroupId = $request->query->has('playerGroup')
            ? (int) $request->query->get('playerGroup')
            : null;

        return new JsonResponse([
            'averageGameDuration' => $this->globalStatisticsService->getAverageGameDurationSeconds($playerGroupId),
            'contractDistribution' => $this->globalStatisticsService->getContractDistribution($playerGroupId),
            'contractSuccessRateByPlayer' => $this->globalStatisticsService->getContractSuccessRateByPlayer($playerGroupId),
            'eloEvolution' => $this->globalStatisticsService->getAllPlayersEloHistory($playerGroupId),
            'eloRanking' => $this->globalStatisticsService->getEloRanking($playerGroupId),
            'leaderboard' => $this->globalStatisticsService->getLeaderboard($playerGroupId),
            'totalGames' => $this->globalStatisticsService->getTotalGames($playerGroupId),
            'totalPlayTime' => $this->globalStatisticsService->getTotalPlayTimeSeconds($playerGroupId),
            'totalSessions' => $this->globalStatisticsService->getTotalSessions($playerGroupId),
            'totalStars' => $this->globalStatisticsService->getTotalStars($playerGroupId),
        ]);
    }

    #[Route('/api/statistics/players/{id}', methods: ['GET'])]
    public function player(int $id, Request $request): JsonResponse
    {
        $player = $this->em->find(Player::class, $id);
        if (null === $player) {
            throw new NotFoundHttpException('Joueur introuvable.');
        }

        $this->badgeChecker->checkAndAwardForPlayer($player);

        $playerGroupId = $request->query->has('playerGroup')
            ? (int) $request->query->get('playerGroup')
            : null;

        return new JsonResponse($this->playerStatisticsService->getPlayerStats($player, $playerGroupId));
    }
}
