<?php

declare(strict_types=1);

namespace App\Validator;

use App\Entity\Game;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;
use Symfony\Component\Validator\Exception\UnexpectedValueException;

class PlayersBelongToSessionValidator extends ConstraintValidator
{
    public function validate(mixed $value, Constraint $constraint): void
    {
        if (!$value instanceof Game) {
            throw new UnexpectedValueException($value, Game::class);
        }

        if (!$constraint instanceof PlayersBelongToSession) {
            throw new UnexpectedValueException($constraint, PlayersBelongToSession::class);
        }

        $session = $value->getSession();
        $sessionPlayers = $session->getPlayers();

        // Vérifier le preneur
        $taker = $value->getTaker();
        if (!$sessionPlayers->contains($taker)) {
            $this->context->buildViolation($constraint->message)
                ->setParameter('{{ player }}', $taker->getName())
                ->atPath('taker')
                ->addViolation();
        }

        // Vérifier le partenaire
        $partner = $value->getPartner();
        if (null !== $partner && !$sessionPlayers->contains($partner)) {
            $this->context->buildViolation($constraint->message)
                ->setParameter('{{ player }}', $partner->getName())
                ->atPath('partner')
                ->addViolation();
        }
    }
}
