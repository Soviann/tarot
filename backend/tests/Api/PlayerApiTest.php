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
        $this->assertJsonContains(['name' => 'Alice']);
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
        $this->assertArrayHasKey('id', $member);
        $this->assertArrayHasKey('name', $member);
        $this->assertArrayHasKey('createdAt', $member);
    }
}
