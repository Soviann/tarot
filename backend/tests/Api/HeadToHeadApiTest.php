<?php

declare(strict_types=1);

namespace App\Tests\Api;

use App\Enum\Contract;

final class HeadToHeadApiTest extends ApiTestCase
{
    public function testReturns400WhenMissingParams(): void
    {
        $this->client->request('GET', '/api/statistics/head-to-head');
        self::assertResponseStatusCodeSame(400);
    }

    public function testReturns400WhenMissingPlayer2(): void
    {
        $player = $this->createPlayer('Alice');
        $this->client->request('GET', '/api/statistics/head-to-head?player1='.$player->getId());
        self::assertResponseStatusCodeSame(400);
    }

    public function testReturns400WhenIdenticalPlayers(): void
    {
        $player = $this->createPlayer('Alice');
        $id = $player->getId();
        $this->client->request('GET', '/api/statistics/head-to-head?player1='.$id.'&player2='.$id);
        self::assertResponseStatusCodeSame(400);
    }

    public function testReturns404WhenPlayerNotFound(): void
    {
        $player = $this->createPlayer('Alice');
        $this->client->request('GET', '/api/statistics/head-to-head?player1='.$player->getId().'&player2=9999');
        self::assertResponseStatusCodeSame(404);
    }

    public function testReturnsHeadToHeadWithData(): void
    {
        $this->client->disableReboot();

        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'David', 'Eve');
        $players = $session->getPlayers()->toArray();
        $alice = $players[0];
        $bob = $players[1];

        // Alice takes, Bob is defender (no partner)
        $this->completeGame($session, $alice, Contract::Petite, takerScore: 100);

        // Bob takes, Alice is defender (no partner)
        $this->completeGame($session, $bob, Contract::Garde, takerScore: -50);

        // Alice takes with Bob as partner
        $this->completeGame($session, $alice, Contract::Garde, partner: $bob, takerScore: 200);

        $response = $this->client->request(
            'GET',
            '/api/statistics/head-to-head?player1='.$alice->getId().'&player2='.$bob->getId(),
        );

        self::assertResponseStatusCodeSame(200);

        $data = $response->toArray();

        self::assertSame(1, $data['sharedSessions']);
        self::assertSame(3, $data['sharedGames']);

        // Alice stats
        self::assertSame($alice->getId(), $data['player1']['playerId']);
        self::assertSame('Alice', $data['player1']['playerName']);
        self::assertSame(2, $data['player1']['gamesAsTaker']);
        self::assertSame(2, $data['player1']['winsAsTaker']);
        // Alice took, Bob was defender (no partner): game 1 only
        self::assertSame(1, $data['player1']['gamesAsTakerVsOtherAsDefender']);
        self::assertSame(1, $data['player1']['winsAsTakerVsOtherAsDefender']);
        // Alice called Bob as partner once (game 3)
        self::assertSame(1, $data['player1']['calledOtherAsPartner']);

        // Bob stats
        self::assertSame($bob->getId(), $data['player2']['playerId']);
        self::assertSame('Bob', $data['player2']['playerName']);
        self::assertSame(1, $data['player2']['gamesAsTaker']);
        self::assertSame(0, $data['player2']['winsAsTaker']);
        // Bob took, Alice was defender: game 2
        self::assertSame(1, $data['player2']['gamesAsTakerVsOtherAsDefender']);
        self::assertSame(0, $data['player2']['winsAsTakerVsOtherAsDefender']);
        // Bob never called Alice as partner
        self::assertSame(0, $data['player2']['calledOtherAsPartner']);

        // Global stats (all games, not just shared)
        self::assertArrayHasKey('globalPlayer1', $data);
        self::assertArrayHasKey('globalPlayer2', $data);

        $g1 = $data['globalPlayer1'];
        self::assertSame($alice->getId(), $g1['playerId']);
        self::assertSame('Alice', $g1['playerName']);
        self::assertSame(3, $g1['gamesPlayed']);
        self::assertSame(2, $g1['gamesAsTaker']);
        self::assertSame(2, $g1['winsAsTaker']);

        $g2 = $data['globalPlayer2'];
        self::assertSame($bob->getId(), $g2['playerId']);
        self::assertSame('Bob', $g2['playerName']);
        self::assertSame(3, $g2['gamesPlayed']);
        self::assertSame(1, $g2['gamesAsTaker']);
        self::assertSame(0, $g2['winsAsTaker']);
    }

    public function testRespectsDateFilter(): void
    {
        $this->client->disableReboot();

        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'David', 'Eve');
        $players = $session->getPlayers()->toArray();
        $alice = $players[0];
        $bob = $players[1];

        $this->completeGame($session, $alice, completedAt: new \DateTimeImmutable('2025-01-15'), takerScore: 100);
        $this->completeGame($session, $bob, completedAt: new \DateTimeImmutable('2025-06-15'), takerScore: 50);

        $response = $this->client->request(
            'GET',
            '/api/statistics/head-to-head?player1='.$alice->getId().'&player2='.$bob->getId().'&from=2025-06-01&to=2025-12-31',
        );

        self::assertResponseStatusCodeSame(200);

        $data = $response->toArray();

        // Only game 2 (June) should count
        self::assertSame(1, $data['sharedGames']);
        self::assertSame(0, $data['player1']['gamesAsTaker']);
        self::assertSame(1, $data['player2']['gamesAsTaker']);
    }

    public function testRespectsGroupFilter(): void
    {
        $this->client->disableReboot();

        $session1 = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'David', 'Eve');
        $players1 = $session1->getPlayers()->toArray();
        $alice1 = $players1[0];
        $bob1 = $players1[1];

        $group = $this->createPlayerGroup('Group A', $alice1, $bob1);
        $session1->setPlayerGroup($group);
        $this->em->flush();

        $this->completeGame($session1, $alice1, takerScore: 100);

        // Second session without the group
        $session2 = $this->createSessionWithPlayers('Alice2', 'Bob2', 'C', 'D', 'E');
        $this->completeGame($session2, $session2->getPlayers()->first(), takerScore: 50);

        $response = $this->client->request(
            'GET',
            '/api/statistics/head-to-head?player1='.$alice1->getId().'&player2='.$bob1->getId().'&playerGroup='.$group->getId(),
        );

        self::assertResponseStatusCodeSame(200);

        $data = $response->toArray();

        self::assertSame(1, $data['sharedSessions']);
        self::assertSame(1, $data['sharedGames']);
    }
}
