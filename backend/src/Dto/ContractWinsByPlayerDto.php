<?php

declare(strict_types=1);

namespace App\Dto;

use App\Enum\Contract;

final readonly class ContractWinsByPlayerDto
{
    public int $playerId;
    public int $wins;

    public function __construct(
        public Contract $contract,
        int|string $playerId,
        int|string $wins,
    ) {
        $this->playerId = (int) $playerId;
        $this->wins = (int) $wins;
    }
}
