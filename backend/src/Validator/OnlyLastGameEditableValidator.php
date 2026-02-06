<?php

declare(strict_types=1);

namespace App\Validator;

use App\Entity\Game;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;
use Symfony\Component\Validator\Exception\UnexpectedValueException;

class OnlyLastGameEditableValidator extends ConstraintValidator
{
    public function __construct(
        private readonly EntityManagerInterface $em,
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

        $maxPosition = (int) $this->em->createQuery(
            'SELECT MAX(g.position) FROM App\Entity\Game g WHERE g.session = :sessionId'
        )
            ->setParameter('sessionId', $value->getSession()->getId())
            ->getSingleScalarResult();

        if ($value->getPosition() < $maxPosition) {
            $this->context->buildViolation($constraint->message)
                ->addViolation();
        }
    }
}
