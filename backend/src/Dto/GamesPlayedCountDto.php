<?php

declare(strict_types=1);

namespace App\Dto;

final readonly class GamesPlayedCountDto
{
    public int $gamesPlayed;
    public int $playerId;

    public function __construct(
        int|string $gamesPlayed,
        int|string $playerId,
    ) {
        $this->gamesPlayed = (int) $gamesPlayed;
        $this->playerId = (int) $playerId;
    }
}
