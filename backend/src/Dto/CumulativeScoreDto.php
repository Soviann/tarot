<?php

declare(strict_types=1);

namespace App\Dto;

final readonly class CumulativeScoreDto
{
    public int $playerId;
    public int $score;

    public function __construct(
        int|string $playerId,
        public string $playerName,
        int|string $score,
    ) {
        $this->playerId = (int) $playerId;
        $this->score = (int) $score;
    }
}
