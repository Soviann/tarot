<?php

declare(strict_types=1);

namespace App\Tests\Unit\Entity;

use App\Entity\Player;
use App\Entity\Session;
use PHPUnit\Framework\TestCase;

class SessionTest extends TestCase
{
    public function testGetOrderedPlayersReturnsDefaultOrderWhenNull(): void
    {
        $session = new Session();
        $players = $this->createPlayers(['Alice', 'Bob', 'Charlie', 'Diana', 'Eve']);
        foreach ($players as $player) {
            $session->addPlayer($player);
        }

        // playerOrder is null by default → returns players as-is
        $ordered = $session->getOrderedPlayers();
        $this->assertCount(5, $ordered);
        $this->assertSame($players, $ordered);
    }

    public function testGetOrderedPlayersReturnsCustomOrder(): void
    {
        $session = new Session();
        $players = $this->createPlayers(['Alice', 'Bob', 'Charlie', 'Diana', 'Eve']);
        foreach ($players as $player) {
            $session->addPlayer($player);
        }

        // Custom order: Eve, Charlie, Alice, Diana, Bob
        $customOrder = [5, 3, 1, 4, 2];
        $session->setPlayerOrder($customOrder);

        $ordered = $session->getOrderedPlayers();
        $this->assertSame('Eve', $ordered[0]->getName());
        $this->assertSame('Charlie', $ordered[1]->getName());
        $this->assertSame('Alice', $ordered[2]->getName());
        $this->assertSame('Diana', $ordered[3]->getName());
        $this->assertSame('Bob', $ordered[4]->getName());
    }

    public function testAdvanceDealerFollowsCustomOrder(): void
    {
        $session = new Session();
        $players = $this->createPlayers(['Alice', 'Bob', 'Charlie', 'Diana', 'Eve']);
        foreach ($players as $player) {
            $session->addPlayer($player);
        }

        // Custom order: Eve(5), Charlie(3), Alice(1), Diana(4), Bob(2)
        $session->setPlayerOrder([5, 3, 1, 4, 2]);
        $session->setCurrentDealer($players[4]); // Eve

        $session->advanceDealer();
        $this->assertSame('Charlie', $session->getCurrentDealer()->getName());

        $session->advanceDealer();
        $this->assertSame('Alice', $session->getCurrentDealer()->getName());
    }

    public function testAdvanceDealerWrapsAroundWithCustomOrder(): void
    {
        $session = new Session();
        $players = $this->createPlayers(['Alice', 'Bob', 'Charlie', 'Diana', 'Eve']);
        foreach ($players as $player) {
            $session->addPlayer($player);
        }

        // Custom order: Eve(5), Charlie(3), Alice(1), Diana(4), Bob(2)
        $session->setPlayerOrder([5, 3, 1, 4, 2]);
        $session->setCurrentDealer($players[1]); // Bob — last in custom order

        $session->advanceDealer();
        $this->assertSame('Eve', $session->getCurrentDealer()->getName()); // wraps to first
    }

    /**
     * @return Player[]
     */
    private function createPlayers(array $names): array
    {
        $players = [];
        $id = 1;
        foreach ($names as $name) {
            $player = new Player();
            $player->setName($name);
            // Use reflection to set the ID
            $ref = new \ReflectionProperty(Player::class, 'id');
            $ref->setValue($player, $id++);
            $players[] = $player;
        }

        return $players;
    }
}
