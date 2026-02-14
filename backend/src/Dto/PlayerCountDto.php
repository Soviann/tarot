<?php

declare(strict_types=1);

namespace App\Dto;

final readonly class PlayerCountDto
{
    public int $count;
    public int $playerId;

    public function __construct(
        int|string $count,
        int|string $playerId,
    ) {
        $this->count = (int) $count;
        $this->playerId = (int) $playerId;
    }
}
