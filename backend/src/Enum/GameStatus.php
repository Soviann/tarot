<?php

namespace App\Enum;

enum GameStatus: string
{
    case Completed = 'completed';
    case InProgress = 'in_progress';
}
