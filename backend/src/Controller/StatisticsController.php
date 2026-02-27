<?php

declare(strict_types=1);

namespace App\Controller;

use App\Dto\DateRange;
use App\Repository\PlayerRepository;
use App\Service\GlobalStatisticsService;
use App\Service\HeadToHeadService;
use App\Service\PlayerStatisticsService;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\BadRequestHttpException;
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

    #[Route('/api/statistics/head-to-head', methods: ['GET'])]
    public function headToHead(Request $request, HeadToHeadService $headToHeadService): JsonResponse
    {
        $player1Id = $request->query->get('player1');
        $player2Id = $request->query->get('player2');

        if (null === $player1Id || null === $player2Id) {
            throw new BadRequestHttpException('Les paramètres player1 et player2 sont requis.');
        }

        $player1Id = (int) $player1Id;
        $player2Id = (int) $player2Id;

        if ($player1Id === $player2Id) {
            throw new BadRequestHttpException('Les deux joueurs doivent être différents.');
        }

        $player1 = $this->playerRepository->find($player1Id);
        if (null === $player1) {
            throw new NotFoundHttpException('Joueur 1 introuvable.');
        }

        $player2 = $this->playerRepository->find($player2Id);
        if (null === $player2) {
            throw new NotFoundHttpException('Joueur 2 introuvable.');
        }

        $dateRange = $this->parseDateRange($request);
        $playerGroupId = $request->query->has('playerGroup')
            ? (int) $request->query->get('playerGroup')
            : null;

        return new JsonResponse($headToHeadService->getHeadToHead($player1, $player2, $dateRange, $playerGroupId));
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
