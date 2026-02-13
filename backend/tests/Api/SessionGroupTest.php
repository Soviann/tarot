<?php

declare(strict_types=1);

namespace App\Tests\Api;

use App\Entity\Session;

class SessionGroupTest extends ApiTestCase
{
    public function testAutoAssociationOnCreate(): void
    {
        $this->client->disableReboot();

        $players = [];
        foreach (['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'] as $name) {
            $players[] = $this->createPlayer($name);
        }

        $group = $this->createPlayerGroup('Mardi soir', ...$players);

        $response = $this->client->request('POST', '/api/sessions', [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => [
                'players' => \array_map(fn ($p) => $this->getIri($p), $players),
            ],
        ]);

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();
        $this->assertNotNull($data['playerGroup']);
        $this->assertSame($group->getId(), $data['playerGroup']['id']);
    }

    public function testNoAutoAssociationWithMultipleMatchingGroups(): void
    {
        $this->client->disableReboot();

        $players = [];
        foreach (['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'] as $name) {
            $players[] = $this->createPlayer($name);
        }

        $this->createPlayerGroup('Mardi soir', ...$players);
        $this->createPlayerGroup('Famille', ...$players);

        $response = $this->client->request('POST', '/api/sessions', [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => [
                'players' => \array_map(fn ($p) => $this->getIri($p), $players),
            ],
        ]);

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();
        $this->assertNull($data['playerGroup']);
    }

    public function testManualGroupAssignmentPropagatesPlayers(): void
    {
        $this->client->disableReboot();

        $players = [];
        foreach (['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'] as $name) {
            $players[] = $this->createPlayer($name);
        }

        $group = $this->createPlayerGroup('Mardi soir', $players[0], $players[1], $players[2]);

        $session = new Session();
        foreach ($players as $player) {
            $session->addPlayer($player);
        }
        $this->em->persist($session);
        $this->em->flush();

        $this->client->request('PATCH', '/api/sessions/'.$session->getId(), [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => ['playerGroup' => $this->getIri($group)],
        ]);

        $this->assertResponseIsSuccessful();

        $response = $this->client->request('GET', $this->getIri($group));
        $data = $response->toArray();
        $this->assertCount(5, $data['players']);
    }

    public function testSessionResponseIncludesPlayerGroup(): void
    {
        $this->client->disableReboot();

        $players = [];
        foreach (['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'] as $name) {
            $players[] = $this->createPlayer($name);
        }

        $group = $this->createPlayerGroup('Mardi soir', ...$players);

        $session = new Session();
        foreach ($players as $player) {
            $session->addPlayer($player);
        }
        $session->setPlayerGroup($group);
        $this->em->persist($session);
        $this->em->flush();

        $response = $this->client->request('GET', '/api/sessions');

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();
        $member = $data['member'][0];
        $this->assertArrayHasKey('playerGroup', $member);
        $this->assertSame($group->getId(), $member['playerGroup']['id']);
        $this->assertSame('Mardi soir', $member['playerGroup']['name']);
    }
}
