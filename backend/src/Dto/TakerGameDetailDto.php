<?php

declare(strict_types=1);

namespace App\Dto;

use App\Util\EnumHelper;

final readonly class TakerGameDetailDto
{
    public string $chelem;
    public string $contract;
    public int $gameId;
    public int $oudlers;
    public ?int $partnerId;
    public string $poignee;
    public string $poigneeOwner;
    public float $points;
    public int $takerId;
    public int $takerScore;

    public function __construct(
        \BackedEnum|int|string $chelem,
        \BackedEnum|int|string $contract,
        int|string $gameId,
        int|string $oudlers,
        int|string|null $partnerId,
        \BackedEnum|int|string $poignee,
        \BackedEnum|int|string $poigneeOwner,
        float|int|string $points,
        int|string $takerId,
        int|string $takerScore,
    ) {
        $this->chelem = EnumHelper::toString($chelem);
        $this->contract = EnumHelper::toString($contract);
        $this->gameId = (int) $gameId;
        $this->oudlers = (int) $oudlers;
        $this->partnerId = null !== $partnerId ? (int) $partnerId : null;
        $this->poignee = EnumHelper::toString($poignee);
        $this->poigneeOwner = EnumHelper::toString($poigneeOwner);
        $this->points = (float) $points;
        $this->takerId = (int) $takerId;
        $this->takerScore = (int) $takerScore;
    }
}
