<?php

declare(strict_types=1);

namespace App\Validator;

use Symfony\Component\Validator\Constraint;

/**
 * Vérifie que le donneur appartient à la session.
 */
#[\Attribute(\Attribute::TARGET_CLASS)]
class DealerBelongsToSession extends Constraint
{
    public string $message = 'Le donneur doit être un joueur de la session.';

    public function getTargets(): string
    {
        return self::CLASS_CONSTRAINT;
    }
}
