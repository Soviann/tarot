<?php

declare(strict_types=1);

namespace App\Enum;

enum Poignee: string
{
    case Double = 'double';
    case None = 'none';
    case Simple = 'simple';
    case Triple = 'triple';
}
