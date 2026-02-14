<?php

declare(strict_types=1);

namespace App\Dto;

use App\Enum\Contract;

final readonly class PlayerExtremeScoreDto
{
    public int $score;
    public int $sessionId;

    public function __construct(
        public Contract $contract,
        public \DateTimeImmutable $date,
        int|string $score,
        int|string $sessionId,
    ) {
        $this->score = (int) $score;
        $this->sessionId = (int) $sessionId;
    }
}
