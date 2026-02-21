<?php

declare(strict_types=1);

namespace App\Dto;

final readonly class GameTakerScoreDto
{
    public int $gameId;
    public ?int $partnerId;
    public int $playerId;
    public string $poignee;
    public string $poigneeOwner;
    public int $takerId;
    public int $takerScore;

    public function __construct(
        int|string $playerId,
        int|string $gameId,
        int|string|null $partnerId,
        \BackedEnum|int|string $poignee,
        \BackedEnum|int|string $poigneeOwner,
        int|string $takerId,
        int|string $takerScore,
    ) {
        $this->gameId = (int) $gameId;
        $this->partnerId = null !== $partnerId ? (int) $partnerId : null;
        $this->playerId = (int) $playerId;
        $this->poignee = (string) ($poignee instanceof \BackedEnum ? $poignee->value : $poignee);
        $this->poigneeOwner = (string) ($poigneeOwner instanceof \BackedEnum ? $poigneeOwner->value : $poigneeOwner);
        $this->takerId = (int) $takerId;
        $this->takerScore = (int) $takerScore;
    }
}
