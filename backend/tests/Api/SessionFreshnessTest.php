<?php

declare(strict_types=1);

namespace App\Tests\Api;

class SessionFreshnessTest extends ApiTestCase
{
    public function testFreshnessReturnsUpdatedAt(): void
    {
        $session = $this->createSessionWithPlayers();

        $response = static::createClient()->request('GET', '/api/sessions/'.$session->getId().'/freshness');

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();
        $this->assertArrayHasKey('updatedAt', $data);
    }

    public function testFreshnessReturns404ForUnknownSession(): void
    {
        static::createClient()->request('GET', '/api/sessions/99999/freshness');

        $this->assertResponseStatusCodeSame(404);
    }

    public function testFreshnessUpdatesAfterGameCreation(): void
    {
        $client = static::createClient();
        $client->disableReboot();

        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Dave', 'Eve');

        $response = $client->request('GET', '/api/sessions/'.$session->getId().'/freshness');
        $before = $response->toArray()['updatedAt'];

        // Attendre 1 seconde pour que le timestamp change
        \usleep(1_100_000);

        // Créer une donne
        $taker = $session->getPlayers()->first();
        $client->request('POST', '/api/sessions/'.$session->getId().'/games', [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => [
                'contract' => 'petite',
                'taker' => $this->getIri($taker),
            ],
        ]);
        $this->assertResponseIsSuccessful();

        $response = $client->request('GET', '/api/sessions/'.$session->getId().'/freshness');
        $after = $response->toArray()['updatedAt'];

        $this->assertNotSame($before, $after, 'updatedAt should change after game creation');
    }
}
