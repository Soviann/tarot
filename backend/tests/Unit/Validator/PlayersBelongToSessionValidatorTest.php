<?php

declare(strict_types=1);

namespace App\Tests\Unit\Validator;

use App\Entity\Game;
use App\Entity\Player;
use App\Entity\Session;
use App\Enum\Contract;
use App\Validator\PlayersBelongToSession;
use App\Validator\PlayersBelongToSessionValidator;
use Symfony\Component\Validator\Test\ConstraintValidatorTestCase;

/**
 * @extends ConstraintValidatorTestCase<PlayersBelongToSessionValidator>
 */
class PlayersBelongToSessionValidatorTest extends ConstraintValidatorTestCase
{
    public function testTakerInSessionIsValid(): void
    {
        $taker = $this->createPlayer(1, 'Alice');
        $session = new Session();
        $session->addPlayer($taker);

        $game = new Game();
        $game->setContract(Contract::Petite);
        $game->setSession($session);
        $game->setTaker($taker);

        $this->validator->validate($game, new PlayersBelongToSession());

        $this->assertNoViolation();
    }

    public function testTakerNotInSessionIsInvalid(): void
    {
        $taker = $this->createPlayer(1, 'Alice');
        $otherPlayer = $this->createPlayer(2, 'Bob');
        $session = new Session();
        $session->addPlayer($otherPlayer);

        $game = new Game();
        $game->setContract(Contract::Petite);
        $game->setSession($session);
        $game->setTaker($taker);

        $this->validator->validate($game, new PlayersBelongToSession());

        $this->buildViolation('Le joueur "{{ player }}" n\'appartient pas à la session.')
            ->setParameter('{{ player }}', 'Alice')
            ->atPath('property.path.taker')
            ->assertRaised();
    }

    public function testPartnerInSessionIsValid(): void
    {
        $partner = $this->createPlayer(2, 'Bob');
        $taker = $this->createPlayer(1, 'Alice');
        $session = new Session();
        $session->addPlayer($partner);
        $session->addPlayer($taker);

        $game = new Game();
        $game->setContract(Contract::Petite);
        $game->setPartner($partner);
        $game->setSession($session);
        $game->setTaker($taker);

        $this->validator->validate($game, new PlayersBelongToSession());

        $this->assertNoViolation();
    }

    public function testPartnerNotInSessionIsInvalid(): void
    {
        $partner = $this->createPlayer(2, 'Bob');
        $taker = $this->createPlayer(1, 'Alice');
        $session = new Session();
        $session->addPlayer($taker);

        $game = new Game();
        $game->setContract(Contract::Petite);
        $game->setPartner($partner);
        $game->setSession($session);
        $game->setTaker($taker);

        $this->validator->validate($game, new PlayersBelongToSession());

        $this->buildViolation('Le joueur "{{ player }}" n\'appartient pas à la session.')
            ->setParameter('{{ player }}', 'Bob')
            ->atPath('property.path.partner')
            ->assertRaised();
    }

    protected function createValidator(): PlayersBelongToSessionValidator
    {
        return new PlayersBelongToSessionValidator();
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
