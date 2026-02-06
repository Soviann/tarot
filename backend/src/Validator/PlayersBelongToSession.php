<?php

declare(strict_types=1);

namespace App\Validator;

use Symfony\Component\Validator\Constraint;

/**
 * Vérifie que le preneur et le partenaire d'une donne appartiennent à la session.
 */
#[\Attribute(\Attribute::TARGET_CLASS)]
class PlayersBelongToSession extends Constraint
{
    public string $message = 'Le joueur "{{ player }}" n\'appartient pas à la session.';

    public function getTargets(): string
    {
        return self::CLASS_CONSTRAINT;
    }
}
