<?php

declare(strict_types=1);

namespace App\Enum;

enum Chelem: string
{
    case AnnouncedLost = 'announced_lost';
    case AnnouncedWon = 'announced_won';
    case None = 'none';
    case NotAnnouncedWon = 'not_announced_won';
}
