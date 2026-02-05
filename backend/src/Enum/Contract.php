<?php

namespace App\Enum;

enum Contract: string
{
    case Garde = 'garde';
    case GardeContre = 'garde_contre';
    case GardeSans = 'garde_sans';
    case Petite = 'petite';
}
