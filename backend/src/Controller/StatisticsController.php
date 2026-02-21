<?php

declare(strict_types=1);

namespace App\Controller;

use App\Dto\DateRange;
use App\Repository\PlayerRepository;
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
        $dateRange = $this->parseDateRange($request);
        $playerGroupId = $request->query->has('playerGroup')
            ? (int) $request->query->get('playerGroup')
            : null;

        return new JsonResponse([
            'averageGameDuration' => $globalStatisticsService->getAverageGameDurationSeconds($dateRange, $playerGroupId),
            'contractDistribution' => $globalStatisticsService->getContractDistribution($dateRange, $playerGroupId),
            'contractSuccessRateByPlayer' => $globalStatisticsService->getContractSuccessRateByPlayer($dateRange, $playerGroupId),
            'eloEvolution' => $globalStatisticsService->getAllPlayersEloHistory($dateRange, $playerGroupId),
            'eloRanking' => $globalStatisticsService->getEloRanking($playerGroupId),
            'leaderboard' => $globalStatisticsService->getLeaderboard($dateRange, $playerGroupId),
            'totalGames' => $globalStatisticsService->getTotalGames($dateRange, $playerGroupId),
            'totalPlayTime' => $globalStatisticsService->getTotalPlayTimeSeconds($dateRange, $playerGroupId),
            'totalSessions' => $globalStatisticsService->getTotalSessions($dateRange, $playerGroupId),
            'totalStars' => $globalStatisticsService->getTotalStars($dateRange, $playerGroupId),
        ]);
    }

    #[Route('/api/statistics/players/{id}', methods: ['GET'])]
    public function player(int $id, Request $request, PlayerStatisticsService $playerStatisticsService): JsonResponse
    {
        $player = $this->playerRepository->find($id);
        if (null === $player) {
            throw new NotFoundHttpException('Joueur introuvable.');
        }

        $dateRange = $this->parseDateRange($request);
        $playerGroupId = $request->query->has('playerGroup')
            ? (int) $request->query->get('playerGroup')
            : null;

        return new JsonResponse($playerStatisticsService->getPlayerStats($player, $dateRange, $playerGroupId));
    }

    private function parseDateRange(Request $request): ?DateRange
    {
        $fromStr = $request->query->get('from');
        $toStr = $request->query->get('to');

        if (null === $fromStr && null === $toStr) {
            return null;
        }

        $from = null;
        $to = null;

        if (null !== $fromStr) {
            $parsed = \DateTimeImmutable::createFromFormat('Y-m-d', $fromStr);
            if (false !== $parsed) {
                $from = $parsed->setTime(0, 0, 0);
            }
        }

        if (null !== $toStr) {
            $parsed = \DateTimeImmutable::createFromFormat('Y-m-d', $toStr);
            if (false !== $parsed) {
                $to = $parsed->setTime(23, 59, 59);
            }
        }

        return new DateRange(from: $from, to: $to);
    }
}
