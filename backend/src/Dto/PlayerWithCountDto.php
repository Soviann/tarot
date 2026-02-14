<?php

declare(strict_types=1);

namespace App\Dto;

final readonly class PlayerWithCountDto
{
    public int $count;
    public int $playerId;

    public function __construct(
        int|string $count,
        public ?string $playerColor,
        int|string $playerId,
        public string $playerName,
    ) {
        $this->count = (int) $count;
        $this->playerId = (int) $playerId;
    }
}
