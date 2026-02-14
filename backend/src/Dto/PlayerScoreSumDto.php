<?php

declare(strict_types=1);

namespace App\Dto;

final readonly class PlayerScoreSumDto
{
    public int $playerId;
    public int $totalScore;

    public function __construct(
        int|string $playerId,
        int|string $totalScore,
    ) {
        $this->playerId = (int) $playerId;
        $this->totalScore = (int) $totalScore;
    }
}
