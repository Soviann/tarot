<?php

declare(strict_types=1);

namespace App\Dto;

final readonly class TotalTakerScoreDto
{
    public int $playerId;
    public int $totalTakerScore;

    public function __construct(
        public ?string $playerColor,
        int|string $playerId,
        public string $playerName,
        int|string $totalTakerScore,
    ) {
        $this->playerId = (int) $playerId;
        $this->totalTakerScore = (int) $totalTakerScore;
    }
}
