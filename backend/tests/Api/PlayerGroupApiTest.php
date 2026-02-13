<?php

declare(strict_types=1);

namespace App\Tests\Api;

class PlayerGroupApiTest extends ApiTestCase
{
    public function testListGroups(): void
    {
        $alice = $this->createPlayer('Alice');
        $bob = $this->createPlayer('Bob');
        $this->createPlayerGroup('Mardi soir', $alice, $bob);
        $this->createPlayerGroup('Famille');

        $response = $this->client->request('GET', '/api/player-groups');

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['totalItems' => 2]);
    }

    public function testCreateGroup(): void
    {
        $alice = $this->createPlayer('Alice');

        $response = $this->client->request('POST', '/api/player-groups', [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => [
                'name' => 'Collègues',
                'players' => [$this->getIri($alice)],
            ],
        ]);

        $this->assertResponseStatusCodeSame(201);
        $this->assertJsonContains(['name' => 'Collègues']);
    }

    public function testCreateGroupWithDuplicateName(): void
    {
        $this->createPlayerGroup('Mardi soir');

        $this->client->request('POST', '/api/player-groups', [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => ['name' => 'Mardi soir'],
        ]);

        $this->assertResponseStatusCodeSame(422);
    }

    public function testCreateGroupWithEmptyName(): void
    {
        $this->client->request('POST', '/api/player-groups', [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => ['name' => ''],
        ]);

        $this->assertResponseStatusCodeSame(422);
    }

    public function testGetGroupDetail(): void
    {
        $alice = $this->createPlayer('Alice');
        $bob = $this->createPlayer('Bob');
        $group = $this->createPlayerGroup('Mardi soir', $alice, $bob);

        $response = $this->client->request('GET', $this->getIri($group));

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['name' => 'Mardi soir']);
        $data = $response->toArray();
        $this->assertCount(2, $data['players']);
    }

    public function testUpdateGroupName(): void
    {
        $group = $this->createPlayerGroup('Mardi soir');

        $this->client->request('PATCH', $this->getIri($group), [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => ['name' => 'Jeudi soir'],
        ]);

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['name' => 'Jeudi soir']);
    }

    public function testUpdateGroupPlayers(): void
    {
        $this->client->disableReboot();

        $alice = $this->createPlayer('Alice');
        $bob = $this->createPlayer('Bob');
        $group = $this->createPlayerGroup('Mardi soir', $alice);

        $this->client->request('PATCH', $this->getIri($group), [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => ['players' => [$this->getIri($alice), $this->getIri($bob)]],
        ]);

        $this->assertResponseIsSuccessful();
        $response = $this->client->request('GET', $this->getIri($group));
        $data = $response->toArray();
        $this->assertCount(2, $data['players']);
    }

    public function testDeleteGroup(): void
    {
        $group = $this->createPlayerGroup('Mardi soir');

        $this->client->request('DELETE', $this->getIri($group));

        $this->assertResponseStatusCodeSame(204);
    }

    public function testPlayerResponseIncludesGroups(): void
    {
        $this->client->disableReboot();

        $alice = $this->createPlayer('Alice');
        $this->createPlayerGroup('Mardi soir', $alice);

        $this->em->clear();

        $response = $this->client->request('GET', $this->getIri($alice));

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();
        $this->assertArrayHasKey('playerGroups', $data);
        $this->assertCount(1, $data['playerGroups']);
    }

    public function testListGroupsResponseFormat(): void
    {
        $this->createPlayerGroup('Mardi soir');

        $response = $this->client->request('GET', '/api/player-groups');

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();
        $member = $data['member'][0];
        $this->assertArrayHasKey('id', $member);
        $this->assertArrayHasKey('name', $member);
        $this->assertArrayHasKey('createdAt', $member);
    }
}
