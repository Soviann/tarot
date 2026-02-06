<?php

declare(strict_types=1);

namespace App\Validator;

use Symfony\Component\Validator\Constraint;

/**
 * Vérifie que seule la dernière donne d'une session est modifiable.
 */
#[\Attribute(\Attribute::TARGET_CLASS)]
class OnlyLastGameEditable extends Constraint
{
    public string $message = 'Seule la dernière donne de la session est modifiable.';

    public function getTargets(): string
    {
        return self::CLASS_CONSTRAINT;
    }
}
