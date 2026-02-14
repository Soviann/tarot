<?php

declare(strict_types=1);

namespace App\Dto;

final readonly class LeaderboardScoreDto
{
    public int $playerId;
    public int $totalScore;

    public function __construct(
        public ?string $playerColor,
        int|string $playerId,
        public string $playerName,
        int|string $totalScore,
    ) {
        $this->playerId = (int) $playerId;
        $this->totalScore = (int) $totalScore;
    }
}
