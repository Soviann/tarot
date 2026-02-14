<?php

declare(strict_types=1);

namespace App\Dto;

use App\Enum\Contract;

final readonly class ContractCountByPlayerDto
{
    public int $count;
    public int $playerId;

    public function __construct(
        public Contract $contract,
        int|string $count,
        public ?string $playerColor,
        int|string $playerId,
        public string $playerName,
    ) {
        $this->count = (int) $count;
        $this->playerId = (int) $playerId;
    }
}
