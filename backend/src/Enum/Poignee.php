<?php

declare(strict_types=1);

namespace App\Enum;

enum Poignee: string
{
    case Double = 'double';
    case None = 'none';
    case Simple = 'simple';
    case Triple = 'triple';

    public function bonus(): int
    {
        return match ($this) {
            self::Double => 30,
            self::None => 0,
            self::Simple => 20,
            self::Triple => 40,
        };
    }
}
