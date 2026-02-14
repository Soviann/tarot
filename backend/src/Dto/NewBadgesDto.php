<?php

declare(strict_types=1);

namespace App\Dto;

use App\Enum\BadgeType;

final readonly class NewBadgesDto implements \JsonSerializable
{
    /**
     * @param array<int, list<BadgeDto>> $badgesByPlayerId
     */
    public function __construct(
        public array $badgesByPlayerId,
    ) {
    }

    /**
     * @param array<int, list<BadgeType>> $newBadges
     */
    public static function fromAwardedBadges(array $newBadges): self
    {
        $formatted = [];

        foreach ($newBadges as $playerId => $badges) {
            $formatted[(int) $playerId] = \array_map(
                static fn (BadgeType $b) => BadgeDto::fromArray($b->toArray()),
                $badges
            );
        }

        return new self($formatted);
    }

    /**
     * Serializes as: { "123": [ {badge}, ... ], "456": [ ... ] }
     *
     * @return array<int, list<array{description: string, emoji: string, label: string, type: string}>>
     */
    public function jsonSerialize(): array
    {
        $out = [];

        foreach ($this->badgesByPlayerId as $playerId => $badges) {
            $out[(int) $playerId] = \array_map(
                static fn (BadgeDto $b) => $b->jsonSerialize(),
                $badges
            );
        }

        return $out;
    }
}
