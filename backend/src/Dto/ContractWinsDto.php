<?php

declare(strict_types=1);

namespace App\Dto;

use App\Enum\Contract;

final readonly class ContractWinsDto
{
    public int $wins;

    public function __construct(
        public Contract $contract,
        int|string $wins,
    ) {
        $this->wins = (int) $wins;
    }
}
