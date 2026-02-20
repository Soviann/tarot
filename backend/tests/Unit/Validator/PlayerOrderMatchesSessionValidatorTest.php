<?php

declare(strict_types=1);

namespace App\Tests\Unit\Validator;

use App\Entity\Player;
use App\Entity\Session;
use App\Validator\PlayerOrderMatchesSession;
use App\Validator\PlayerOrderMatchesSessionValidator;
use Symfony\Component\Validator\Test\ConstraintValidatorTestCase;

/**
 * @extends ConstraintValidatorTestCase<PlayerOrderMatchesSessionValidator>
 */
class PlayerOrderMatchesSessionValidatorTest extends ConstraintValidatorTestCase
{
    public function testNullPlayerOrderIsValid(): void
    {
        $session = $this->createSession([1, 2, 3, 4, 5]);
        $session->setPlayerOrder(null);

        $this->validator->validate($session, new PlayerOrderMatchesSession());

        $this->assertNoViolation();
    }

    public function testValidPlayerOrderIsAccepted(): void
    {
        $session = $this->createSession([1, 2, 3, 4, 5]);
        $session->setPlayerOrder([3, 1, 5, 2, 4]);

        $this->validator->validate($session, new PlayerOrderMatchesSession());

        $this->assertNoViolation();
    }

    public function testPlayerOrderWithWrongCountIsInvalid(): void
    {
        $session = $this->createSession([1, 2, 3, 4, 5]);
        $session->setPlayerOrder([1, 2, 3]);

        $this->validator->validate($session, new PlayerOrderMatchesSession());

        $this->buildViolation('L\'ordre des joueurs ne correspond pas aux joueurs de la session.')
            ->atPath('property.path.playerOrder')
            ->assertRaised();
    }

    public function testPlayerOrderWithDuplicatesIsInvalid(): void
    {
        $session = $this->createSession([1, 2, 3, 4, 5]);
        $session->setPlayerOrder([1, 1, 3, 4, 5]);

        $this->validator->validate($session, new PlayerOrderMatchesSession());

        $this->buildViolation('L\'ordre des joueurs ne correspond pas aux joueurs de la session.')
            ->atPath('property.path.playerOrder')
            ->assertRaised();
    }

    public function testPlayerOrderWithWrongIdsIsInvalid(): void
    {
        $session = $this->createSession([1, 2, 3, 4, 5]);
        $session->setPlayerOrder([1, 2, 3, 4, 99]);

        $this->validator->validate($session, new PlayerOrderMatchesSession());

        $this->buildViolation('L\'ordre des joueurs ne correspond pas aux joueurs de la session.')
            ->atPath('property.path.playerOrder')
            ->assertRaised();
    }

    protected function createValidator(): PlayerOrderMatchesSessionValidator
    {
        return new PlayerOrderMatchesSessionValidator();
    }

    private function createSession(array $playerIds): Session
    {
        $session = new Session();
        foreach ($playerIds as $id) {
            $player = new Player();
            $player->setName("Player{$id}");
            $ref = new \ReflectionProperty(Player::class, 'id');
            $ref->setValue($player, $id);
            $session->addPlayer($player);
        }

        return $session;
    }
}
