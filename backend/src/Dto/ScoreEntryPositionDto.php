<?php

declare(strict_types=1);

namespace App\Dto;

final readonly class ScoreEntryPositionDto
{
    public int $playerId;
    public int $position;
    public int $score;

    public function __construct(
        int|string $playerId,
        int|string $position,
        int|string $score,
    ) {
        $this->playerId = (int) $playerId;
        $this->position = (int) $position;
        $this->score = (int) $score;
    }
}
