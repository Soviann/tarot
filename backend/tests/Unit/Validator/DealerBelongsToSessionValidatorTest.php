<?php

declare(strict_types=1);

namespace App\Tests\Unit\Validator;

use App\Entity\Player;
use App\Entity\Session;
use App\Validator\DealerBelongsToSession;
use App\Validator\DealerBelongsToSessionValidator;
use Symfony\Component\Validator\Exception\UnexpectedValueException;
use Symfony\Component\Validator\Test\ConstraintValidatorTestCase;

/**
 * @extends ConstraintValidatorTestCase<DealerBelongsToSessionValidator>
 */
class DealerBelongsToSessionValidatorTest extends ConstraintValidatorTestCase
{
    public function testNullDealerIsValid(): void
    {
        $session = new Session();
        $session->setCurrentDealer(null);

        $this->validator->validate($session, new DealerBelongsToSession());

        $this->assertNoViolation();
    }

    public function testDealerInSessionIsValid(): void
    {
        $dealer = $this->createPlayer(1, 'Alice');
        $session = new Session();
        $session->addPlayer($dealer);
        $session->setCurrentDealer($dealer);

        $this->validator->validate($session, new DealerBelongsToSession());

        $this->assertNoViolation();
    }

    public function testDealerNotInSessionIsInvalid(): void
    {
        $dealer = $this->createPlayer(1, 'Alice');
        $otherPlayer = $this->createPlayer(2, 'Bob');
        $session = new Session();
        $session->addPlayer($otherPlayer);
        $session->setCurrentDealer($dealer);

        $this->validator->validate($session, new DealerBelongsToSession());

        $this->buildViolation('Le donneur doit être un joueur de la session.')
            ->atPath('property.path.currentDealer')
            ->assertRaised();
    }

    public function testInvalidTypeThrowsException(): void
    {
        $this->expectException(UnexpectedValueException::class);

        $this->validator->validate('not a session', new DealerBelongsToSession());
    }

    protected function createValidator(): DealerBelongsToSessionValidator
    {
        return new DealerBelongsToSessionValidator();
    }

    private function createPlayer(int $id, string $name): Player
    {
        $player = new Player();
        $player->setName($name);
        $ref = new \ReflectionProperty(Player::class, 'id');
        $ref->setValue($player, $id);

        return $player;
    }
}
