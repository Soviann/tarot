<?php

declare(strict_types=1);

namespace App\Dto;

final readonly class HeadToHeadGlobalPlayerDto
{
    public function __construct(
        public float $averageScore,
        public int $gamesAsTaker,
        public int $gamesPlayed,
        public ?string $playerColor,
        public int $playerId,
        public string $playerName,
        public int $totalScore,
        public int $winsAsTaker,
    ) {
    }
}
