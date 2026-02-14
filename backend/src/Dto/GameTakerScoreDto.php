<?php

declare(strict_types=1);

namespace App\Dto;

final readonly class GameTakerScoreDto
{
    public int $gameId;
    public ?int $partnerId;
    public int $takerId;
    public int $takerScore;

    public function __construct(
        int|string $gameId,
        int|string|null $partnerId,
        int|string $takerId,
        int|string $takerScore,
    ) {
        $this->gameId = (int) $gameId;
        $this->partnerId = null !== $partnerId ? (int) $partnerId : null;
        $this->takerId = (int) $takerId;
        $this->takerScore = (int) $takerScore;
    }
}
