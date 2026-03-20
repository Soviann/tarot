<?php

declare(strict_types=1);

namespace App\Util;

final class EnumHelper
{
    public static function toString(\BackedEnum|int|string $value): string
    {
        return (string) ($value instanceof \BackedEnum ? $value->value : $value);
    }
}
