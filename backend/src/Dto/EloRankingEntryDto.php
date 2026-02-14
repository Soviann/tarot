<?php

declare(strict_types=1);

namespace App\Dto;

final readonly class EloRankingEntryDto
{
    public int $eloRating;
    public int $gamesPlayed;
    public int $playerId;

    public function __construct(
        int|string $eloRating,
        int|string $gamesPlayed,
        public ?string $playerColor,
        int|string $playerId,
        public string $playerName,
    ) {
        $this->eloRating = (int) $eloRating;
        $this->gamesPlayed = (int) $gamesPlayed;
        $this->playerId = (int) $playerId;
    }
}
