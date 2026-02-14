<?php

declare(strict_types=1);

namespace App\Tests\Api;

class PlayerApiTest extends ApiTestCase
{
    public function testListPlayers(): void
    {
        $this->createPlayer('Alice');
        $this->createPlayer('Bob');

        $response = $this->client->request('GET', '/api/players');

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['totalItems' => 2]);
    }

    public function testCreatePlayer(): void
    {
        $response = $this->client->request('POST', '/api/players', [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => ['name' => 'Alice'],
        ]);

        $this->assertResponseStatusCodeSame(201);
        $this->assertJsonContains(['active' => true, 'name' => 'Alice']);
        $data = $response->toArray();
        $this->assertArrayHasKey('id', $data);
        $this->assertArrayHasKey('createdAt', $data);
    }

    public function testCreatePlayerWithDuplicateName(): void
    {
        $this->createPlayer('Alice');

        $this->client->request('POST', '/api/players', [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => ['name' => 'Alice'],
        ]);

        $this->assertResponseStatusCodeSame(422);
    }

    public function testCreatePlayerWithEmptyName(): void
    {
        $this->client->request('POST', '/api/players', [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => ['name' => ''],
        ]);

        $this->assertResponseStatusCodeSame(422);
    }

    public function testUpdatePlayerName(): void
    {
        $player = $this->createPlayer('Alice');

        $this->client->request('PATCH', $this->getIri($player), [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => ['name' => 'Alicia'],
        ]);

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['name' => 'Alicia']);
    }

    public function testResponseFormat(): void
    {
        $this->createPlayer('Alice');

        $response = $this->client->request('GET', '/api/players');

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();
        $member = $data['member'][0];
        $this->assertArrayHasKey('active', $member);
        $this->assertArrayHasKey('id', $member);
        $this->assertArrayHasKey('name', $member);
        $this->assertArrayHasKey('createdAt', $member);
    }

    public function testPlayerActiveDefaultsToTrue(): void
    {
        $player = $this->createPlayer('Alice');

        $response = $this->client->request('GET', $this->getIri($player));

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['active' => true]);
    }

    public function testDeactivatePlayer(): void
    {
        $player = $this->createPlayer('Alice');

        $this->client->request('PATCH', $this->getIri($player), [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => ['active' => false],
        ]);

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['active' => false, 'name' => 'Alice']);
    }

    public function testReactivatePlayer(): void
    {
        $player = $this->createPlayer('Alice');
        $player->setActive(false);
        $this->em->flush();

        $this->client->request('PATCH', $this->getIri($player), [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => ['active' => true],
        ]);

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['active' => true, 'name' => 'Alice']);
    }

    public function testSetPlayerColor(): void
    {
        $player = $this->createPlayer('Alice');

        $this->client->request('PATCH', $this->getIri($player), [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => ['color' => '#ef4444'],
        ]);

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['color' => '#ef4444', 'name' => 'Alice']);
    }

    public function testSetPlayerColorInvalid(): void
    {
        $player = $this->createPlayer('Alice');

        $this->client->request('PATCH', $this->getIri($player), [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => ['color' => 'not-a-color'],
        ]);

        $this->assertResponseStatusCodeSame(422);
    }

    public function testClearPlayerColor(): void
    {
        $player = $this->createPlayer('Alice');
        $player->setColor('#ef4444');
        $this->em->flush();

        $this->client->request('PATCH', $this->getIri($player), [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => ['color' => null],
        ]);

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['color' => null]);
    }

    public function testPlayerColorDefaultsToNull(): void
    {
        $this->client->request('POST', '/api/players', [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => ['name' => 'Alice'],
        ]);

        $this->assertResponseStatusCodeSame(201);
        $this->assertJsonContains(['color' => null]);
    }

    public function testLastActivityAtDefaultsToNull(): void
    {
        $this->client->request('POST', '/api/players', [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => ['name' => 'Alice'],
        ]);

        $this->assertResponseStatusCodeSame(201);
        $this->assertJsonContains(['lastActivityAt' => null]);
    }

    public function testLastActivityAtInResponseFormat(): void
    {
        $this->createPlayer('Alice');

        $response = $this->client->request('GET', '/api/players');

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();
        $member = $data['member'][0];
        $this->assertArrayHasKey('lastActivityAt', $member);
    }

    public function testLastActivityAtUpdatedOnGameCompletion(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();

        $this->client->disableReboot();

        // Créer une donne en cours
        $response = $this->client->request('POST', $this->getIri($session).'/games', [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => [
                'contract' => 'petite',
                'taker' => $this->getIri($players[0]),
            ],
        ]);
        $gameIri = $response->toArray()['@id'];

        // Compléter la donne
        $this->client->request('PATCH', $gameIri, [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => [
                'oudlers' => 2,
                'points' => 45,
                'status' => 'completed',
            ],
        ]);
        $this->assertResponseIsSuccessful();

        // Vérifier que lastActivityAt est renseigné pour le preneur et un autre joueur
        $response = $this->client->request('GET', $this->getIri($players[0]));
        $this->assertNotNull($response->toArray()['lastActivityAt']);

        $response = $this->client->request('GET', $this->getIri($players[3]));
        $this->assertNotNull($response->toArray()['lastActivityAt']);
    }
}
