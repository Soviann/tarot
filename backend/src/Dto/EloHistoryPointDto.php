<?php

declare(strict_types=1);

namespace App\Dto;

final readonly class EloHistoryPointDto
{
    public int $gameId;
    public int $playerId;
    public int $ratingAfter;

    public function __construct(
        public \DateTimeImmutable $date,
        int|string $gameId,
        public ?string $playerColor,
        int|string $playerId,
        public string $playerName,
        int|string $ratingAfter,
    ) {
        $this->gameId = (int) $gameId;
        $this->playerId = (int) $playerId;
        $this->ratingAfter = (int) $ratingAfter;
    }
}
