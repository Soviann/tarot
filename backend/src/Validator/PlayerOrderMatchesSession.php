<?php

declare(strict_types=1);

namespace App\Validator;

use Symfony\Component\Validator\Constraint;

/**
 * Vérifie que playerOrder contient exactement les mêmes IDs que les joueurs de la session.
 */
#[\Attribute(\Attribute::TARGET_CLASS)]
class PlayerOrderMatchesSession extends Constraint
{
    public string $message = 'L\'ordre des joueurs ne correspond pas aux joueurs de la session.';

    public function getTargets(): string
    {
        return self::CLASS_CONSTRAINT;
    }
}
