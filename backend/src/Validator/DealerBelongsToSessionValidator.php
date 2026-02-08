<?php

declare(strict_types=1);

namespace App\Validator;

use App\Entity\Session;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;
use Symfony\Component\Validator\Exception\UnexpectedValueException;

class DealerBelongsToSessionValidator extends ConstraintValidator
{
    public function validate(mixed $value, Constraint $constraint): void
    {
        if (!$value instanceof Session) {
            throw new UnexpectedValueException($value, Session::class);
        }

        if (!$constraint instanceof DealerBelongsToSession) {
            throw new UnexpectedValueException($constraint, DealerBelongsToSession::class);
        }

        $dealer = $value->getCurrentDealer();

        if (null === $dealer) {
            return;
        }

        if (!$value->getPlayers()->contains($dealer)) {
            $this->context->buildViolation($constraint->message)
                ->atPath('currentDealer')
                ->addViolation();
        }
    }
}
