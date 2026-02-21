<?php

declare(strict_types=1);

namespace App\Dto;

final readonly class PlayerScoreSumDto
{
    public int $playerId;
    public int $sessionId;
    public int $totalScore;

    public function __construct(
        int|string $sessionId,
        int|string $playerId,
        int|string $totalScore,
    ) {
        $this->playerId = (int) $playerId;
        $this->sessionId = (int) $sessionId;
        $this->totalScore = (int) $totalScore;
    }
}
