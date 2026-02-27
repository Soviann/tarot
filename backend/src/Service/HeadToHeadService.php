<?php

declare(strict_types=1);

namespace App\Service;

use App\Dto\DateRange;
use App\Dto\HeadToHeadPlayerDto;
use App\Entity\Player;
use App\Repository\GameRepository;
use App\Repository\ScoreEntryRepository;
use App\Repository\SessionRepository;

final readonly class HeadToHeadService
{
    public function __construct(
        private GameRepository $gameRepository,
        private ScoreEntryRepository $scoreEntryRepository,
        private SessionRepository $sessionRepository,
    ) {
    }

    /**
     * @return array{player1: HeadToHeadPlayerDto, player2: HeadToHeadPlayerDto, sharedGames: int, sharedSessions: int}
     */
    public function getHeadToHead(Player $player1, Player $player2, ?DateRange $dateRange = null, ?int $playerGroupId = null): array
    {
        return [
            'player1' => $this->buildPlayerDto($player1, $player2, $dateRange, $playerGroupId),
            'player2' => $this->buildPlayerDto($player2, $player1, $dateRange, $playerGroupId),
            'sharedGames' => $this->gameRepository->countSharedCompletedGames($player1, $player2, $dateRange, $playerGroupId),
            'sharedSessions' => $this->sessionRepository->countSharedSessions($player1, $player2, $dateRange, $playerGroupId),
        ];
    }

    private function buildPlayerDto(Player $player, Player $other, ?DateRange $dateRange, ?int $playerGroupId): HeadToHeadPlayerDto
    {
        $scores = $this->scoreEntryRepository->getPlayerScoreInSharedSessions($player, $other, $dateRange, $playerGroupId);

        /** @var int $playerId */
        $playerId = $player->getId();

        return new HeadToHeadPlayerDto(
            averageScore: $scores['averageScore'],
            calledOtherAsPartner: $this->gameRepository->countCalledAsPartner($player, $other, $dateRange, $playerGroupId),
            gamesAsTaker: $this->gameRepository->countTakerGamesInSharedSessions($player, $other, $dateRange, $playerGroupId),
            gamesAsTakerVsOtherAsDefender: $this->gameRepository->countTakerVsDefender($player, $other, $dateRange, $playerGroupId),
            playerColor: $player->getColor(),
            playerId: $playerId,
            playerName: $player->getName(),
            totalScore: $scores['totalScore'],
            winsAsTaker: $this->gameRepository->countTakerWinsInSharedSessions($player, $other, $dateRange, $playerGroupId),
            winsAsTakerVsOtherAsDefender: $this->gameRepository->countTakerWinsVsDefender($player, $other, $dateRange, $playerGroupId),
        );
    }
}
