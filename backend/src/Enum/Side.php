<?php

namespace App\Enum;

enum Side: string
{
    case Attack = 'attack';
    case Defense = 'defense';
    case None = 'none';
}
