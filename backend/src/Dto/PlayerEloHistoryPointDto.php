<?php

declare(strict_types=1);

namespace App\Dto;

final readonly class PlayerEloHistoryPointDto
{
    public int $gameId;
    public int $ratingAfter;
    public int $ratingChange;

    public function __construct(
        public \DateTimeImmutable $date,
        int|string $gameId,
        int|string $ratingAfter,
        int|string $ratingChange,
    ) {
        $this->gameId = (int) $gameId;
        $this->ratingAfter = (int) $ratingAfter;
        $this->ratingChange = (int) $ratingChange;
    }
}
