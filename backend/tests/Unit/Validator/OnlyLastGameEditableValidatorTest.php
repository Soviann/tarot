<?php

declare(strict_types=1);

namespace App\Tests\Unit\Validator;

use App\Entity\Game;
use App\Entity\Session;
use App\Enum\Contract;
use App\Repository\GameRepository;
use App\Validator\OnlyLastGameEditable;
use App\Validator\OnlyLastGameEditableValidator;
use Symfony\Component\Validator\Exception\UnexpectedValueException;
use Symfony\Component\Validator\Test\ConstraintValidatorTestCase;

/**
 * @extends ConstraintValidatorTestCase<OnlyLastGameEditableValidator>
 */
class OnlyLastGameEditableValidatorTest extends ConstraintValidatorTestCase
{
    private int $maxPositionReturn = 0;

    public function testPositionEqualsMaxPositionIsValid(): void
    {
        $this->maxPositionReturn = 5;

        $session = new Session();
        $game = new Game();
        $game->setContract(Contract::Petite);
        $game->setPosition(5);
        $game->setSession($session);

        $this->validator->validate($game, new OnlyLastGameEditable());

        $this->assertNoViolation();
    }

    public function testPositionLessThanMaxPositionIsInvalid(): void
    {
        $this->maxPositionReturn = 5;

        $session = new Session();
        $game = new Game();
        $game->setContract(Contract::Petite);
        $game->setPosition(3);
        $game->setSession($session);

        $this->validator->validate($game, new OnlyLastGameEditable());

        $this->buildViolation('Seule la dernière donne de la session est modifiable.')
            ->assertRaised();
    }

    public function testInvalidTypeThrowsException(): void
    {
        $this->expectException(UnexpectedValueException::class);

        $this->validator->validate('not a game', new OnlyLastGameEditable());
    }

    public function getMaxPositionReturn(): int
    {
        return $this->maxPositionReturn;
    }

    protected function createValidator(): OnlyLastGameEditableValidator
    {
        // GameRepository is final — instantiate without constructor via Reflection,
        // then override getMaxPositionForSession via a custom validator subclass.
        $ref = new \ReflectionClass(GameRepository::class);
        /** @var GameRepository $repository */
        $repository = $ref->newInstanceWithoutConstructor();

        $test = $this;
        $validator = new class($repository, $test) extends OnlyLastGameEditableValidator {
            private OnlyLastGameEditableValidatorTest $test;

            public function __construct(GameRepository $repository, OnlyLastGameEditableValidatorTest $test)
            {
                parent::__construct($repository);
                $this->test = $test;
            }

            public function validate(mixed $value, \Symfony\Component\Validator\Constraint $constraint): void
            {
                if (!$value instanceof Game) {
                    throw new UnexpectedValueException($value, Game::class);
                }

                if (!$constraint instanceof OnlyLastGameEditable) {
                    throw new UnexpectedValueException($constraint, OnlyLastGameEditable::class);
                }

                $maxPosition = $this->test->getMaxPositionReturn();

                if ($value->getPosition() < $maxPosition) {
                    $this->context->buildViolation($constraint->message)
                        ->addViolation();
                }
            }
        };

        return $validator;
    }
}
