<?php

declare(strict_types=1);

namespace App\Dto;

use App\Enum\BadgeType;

final readonly class PlayerBadgeUnlockDto
{
    public function __construct(
        public BadgeType $badgeType,
        public \DateTimeImmutable $unlockedAt,
    ) {
    }
}
