<?php

declare(strict_types=1);

namespace App\Dto;

final readonly class HeadToHeadPlayerDto
{
    public function __construct(
        public float $averageScore,
        public int $calledOtherAsPartner,
        public int $gamesAsTaker,
        public int $gamesAsTakerVsOtherAsDefender,
        public ?string $playerColor,
        public int $playerId,
        public string $playerName,
        public int $totalScore,
        public int $winsAsTaker,
        public int $winsAsTakerVsOtherAsDefender,
    ) {
    }
}
