<?php

declare(strict_types=1);

namespace App\Validator;

use App\Entity\Session;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;
use Symfony\Component\Validator\Exception\UnexpectedValueException;

class PlayerOrderMatchesSessionValidator extends ConstraintValidator
{
    public function validate(mixed $value, Constraint $constraint): void
    {
        if (!$value instanceof Session) {
            throw new UnexpectedValueException($value, Session::class);
        }

        if (!$constraint instanceof PlayerOrderMatchesSession) {
            throw new UnexpectedValueException($constraint, PlayerOrderMatchesSession::class);
        }

        $playerOrder = $value->getPlayerOrder();

        if (null === $playerOrder) {
            return;
        }

        $playerIds = $value->getPlayers()->map(
            static fn ($player): ?int => $player->getId()
        )->getValues();

        \sort($playerIds);

        $sortedOrder = $playerOrder;
        \sort($sortedOrder);

        if ($playerIds !== $sortedOrder || \count($playerOrder) !== \count(\array_unique($playerOrder))) {
            $this->context->buildViolation($constraint->message)
                ->atPath('playerOrder')
                ->addViolation();
        }
    }
}
