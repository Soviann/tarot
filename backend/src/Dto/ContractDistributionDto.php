<?php

declare(strict_types=1);

namespace App\Dto;

use App\Enum\Contract;

final readonly class ContractDistributionDto
{
    public int $count;

    public function __construct(
        public Contract $contract,
        int|string $count,
    ) {
        $this->count = (int) $count;
    }
}
