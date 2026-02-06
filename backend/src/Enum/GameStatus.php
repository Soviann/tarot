<?php

declare(strict_types=1);

namespace App\Enum;

enum GameStatus: string
{
    case Completed = 'completed';
    case InProgress = 'in_progress';
}
