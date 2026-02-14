<?php

declare(strict_types=1);

namespace App\Validator;

use App\Entity\Game;
use App\Repository\GameRepository;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;
use Symfony\Component\Validator\Exception\UnexpectedValueException;

class OnlyLastGameEditableValidator extends ConstraintValidator
{
    public function __construct(
        private readonly GameRepository $gameRepository,
    ) {
    }

    public function validate(mixed $value, Constraint $constraint): void
    {
        if (!$value instanceof Game) {
            throw new UnexpectedValueException($value, Game::class);
        }

        if (!$constraint instanceof OnlyLastGameEditable) {
            throw new UnexpectedValueException($constraint, OnlyLastGameEditable::class);
        }

        $maxPosition = $this->gameRepository->getMaxPositionForSession($value->getSession());

        if ($value->getPosition() < $maxPosition) {
            $this->context->buildViolation($constraint->message)
                ->addViolation();
        }
    }
}
