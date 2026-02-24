<?php

declare(strict_types=1);

namespace App\Tests\Unit\Validator;

use App\Entity\Game;
use App\Entity\Session;
use App\Enum\Contract;
use App\Repository\GameRepository;
use App\Validator\OnlyLastGameEditable;
use App\Validator\OnlyLastGameEditableValidator;
use PHPUnit\Framework\MockObject\MockObject;
use Symfony\Component\Validator\Exception\UnexpectedValueException;
use Symfony\Component\Validator\Test\ConstraintValidatorTestCase;

/**
 * @extends ConstraintValidatorTestCase<OnlyLastGameEditableValidator>
 */
class OnlyLastGameEditableValidatorTest extends ConstraintValidatorTestCase
{
    private GameRepository&MockObject $gameRepository;

    public function testPositionEqualsMaxPositionIsValid(): void
    {
        $session = new Session();
        $game = new Game();
        $game->setContract(Contract::Petite);
        $game->setPosition(5);
        $game->setSession($session);

        $this->gameRepository->method('getMaxPositionForSession')
            ->with($session)
            ->willReturn(5);

        $this->validator->validate($game, new OnlyLastGameEditable());

        $this->assertNoViolation();
    }

    public function testPositionLessThanMaxPositionIsInvalid(): void
    {
        $session = new Session();
        $game = new Game();
        $game->setContract(Contract::Petite);
        $game->setPosition(3);
        $game->setSession($session);

        $this->gameRepository->method('getMaxPositionForSession')
            ->with($session)
            ->willReturn(5);

        $this->validator->validate($game, new OnlyLastGameEditable());

        $this->buildViolation('Seule la dernière donne de la session est modifiable.')
            ->assertRaised();
    }

    public function testInvalidTypeThrowsException(): void
    {
        $this->gameRepository->expects($this->never())->method('getMaxPositionForSession');
        $this->expectException(UnexpectedValueException::class);

        $this->validator->validate('not a game', new OnlyLastGameEditable());
    }

    protected function createValidator(): OnlyLastGameEditableValidator
    {
        $this->gameRepository = $this->createMock(GameRepository::class);

        return new OnlyLastGameEditableValidator($this->gameRepository);
    }
}
