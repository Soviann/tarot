<?php

declare(strict_types=1);

namespace App\Enum;

enum Contract: string
{
    case Garde = 'garde';
    case GardeContre = 'garde_contre';
    case GardeSans = 'garde_sans';
    case Petite = 'petite';

    public function multiplier(): int
    {
        return match ($this) {
            self::Garde => 2,
            self::GardeContre => 6,
            self::GardeSans => 4,
            self::Petite => 1,
        };
    }
}
