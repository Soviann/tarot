<?php

declare(strict_types=1);

namespace App\Dto;

final readonly class BestSessionTotalDto
{
    public \DateTimeImmutable $firstDate;
    public int $sessionId;
    public int $total;

    public function __construct(
        \DateTimeImmutable|string $firstDate,
        int|string $sessionId,
        int|string $total,
    ) {
        $this->firstDate = $firstDate instanceof \DateTimeImmutable ? $firstDate : new \DateTimeImmutable($firstDate);
        $this->sessionId = (int) $sessionId;
        $this->total = (int) $total;
    }
}
