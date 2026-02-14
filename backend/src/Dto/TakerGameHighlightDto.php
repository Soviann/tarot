<?php

declare(strict_types=1);

namespace App\Dto;

use App\Enum\Contract;

final readonly class TakerGameHighlightDto
{
    public int $gameId;
    public int $score;

    public function __construct(
        public Contract $contract,
        int|string $gameId,
        public string $playerName,
        int|string $score,
    ) {
        $this->gameId = (int) $gameId;
        $this->score = (int) $score;
    }
}
