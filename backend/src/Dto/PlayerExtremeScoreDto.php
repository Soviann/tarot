<?php

declare(strict_types=1);

namespace App\Dto;

use App\Enum\Contract;

final readonly class PlayerExtremeScoreDto
{
    public int $gameId;
    public int $score;
    public int $sessionId;

    public function __construct(
        public Contract $contract,
        public \DateTimeImmutable $date,
        int|string $gameId,
        int|string $score,
        int|string $sessionId,
    ) {
        $this->gameId = (int) $gameId;
        $this->score = (int) $score;
        $this->sessionId = (int) $sessionId;
    }
}
