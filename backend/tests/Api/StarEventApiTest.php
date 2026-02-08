<?php

declare(strict_types=1);

namespace App\Tests\Api;

use App\Entity\ScoreEntry;

class StarEventApiTest extends ApiTestCase
{
    public function testCreateStarEvent(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $player = $session->getPlayers()->first();

        $this->client->request('POST', "/api/sessions/{$session->getId()}/star-events", [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => [
                'player' => $this->getIri($player),
            ],
        ]);

        $this->assertResponseStatusCodeSame(201);
    }

    public function testCreateStarEventPlayerNotInSession(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $outsider = $this->createPlayer('Outsider');

        $this->client->request('POST', "/api/sessions/{$session->getId()}/star-events", [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => [
                'player' => $this->getIri($outsider),
            ],
        ]);

        $this->assertResponseStatusCodeSame(422);
    }

    public function testPenaltyTriggeredAtThreeStars(): void
    {
        $this->client->disableReboot();

        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $player = $session->getPlayers()->first();
        $sessionId = $session->getId();

        // Ajouter 3 étoiles
        for ($i = 0; $i < 3; ++$i) {
            $this->client->request('POST', "/api/sessions/{$sessionId}/star-events", [
                'headers' => ['Content-Type' => 'application/ld+json'],
                'json' => [
                    'player' => $this->getIri($player),
                ],
            ]);
            $this->assertResponseStatusCodeSame(201);
        }

        // Vérifier qu'il y a 5 ScoreEntries de pénalité (game IS NULL)
        /** @var list<ScoreEntry> $penaltyEntries */
        $penaltyEntries = $this->em->getRepository(ScoreEntry::class)->findBy([
            'game' => null,
            'session' => $session,
        ]);

        $this->assertCount(5, $penaltyEntries);

        // Vérifier les scores : -100 pour le joueur pénalisé, +25 pour les autres
        $scores = [];
        foreach ($penaltyEntries as $entry) {
            $scores[$entry->getPlayer()->getName()] = $entry->getScore();
        }

        $this->assertSame(-100, $scores[$player->getName()]);

        foreach ($session->getPlayers() as $p) {
            if ($p->getId() !== $player->getId()) {
                $this->assertSame(25, $scores[$p->getName()]);
            }
        }
    }

    public function testPenaltyTriggeredAgainAtSixStars(): void
    {
        $this->client->disableReboot();

        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $player = $session->getPlayers()->first();
        $sessionId = $session->getId();

        // Ajouter 6 étoiles
        for ($i = 0; $i < 6; ++$i) {
            $this->client->request('POST', "/api/sessions/{$sessionId}/star-events", [
                'headers' => ['Content-Type' => 'application/ld+json'],
                'json' => [
                    'player' => $this->getIri($player),
                ],
            ]);
            $this->assertResponseStatusCodeSame(201);
        }

        // 2 pénalités × 5 entrées = 10 ScoreEntries
        /** @var list<ScoreEntry> $penaltyEntries */
        $penaltyEntries = $this->em->getRepository(ScoreEntry::class)->findBy([
            'game' => null,
            'session' => $session,
        ]);

        $this->assertCount(10, $penaltyEntries);
    }

    public function testGetStarEventsCollection(): void
    {
        $this->client->disableReboot();

        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $player = $session->getPlayers()->first();
        $sessionId = $session->getId();

        // Ajouter 2 étoiles
        for ($i = 0; $i < 2; ++$i) {
            $this->client->request('POST', "/api/sessions/{$sessionId}/star-events", [
                'headers' => ['Content-Type' => 'application/ld+json'],
                'json' => [
                    'player' => $this->getIri($player),
                ],
            ]);
        }

        $response = $this->client->request('GET', "/api/sessions/{$sessionId}/star-events");

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['totalItems' => 2]);
    }

    public function testCumulativeScoresIncludeStarPenalties(): void
    {
        $this->client->disableReboot();

        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $player = $session->getPlayers()->first();
        $sessionId = $session->getId();

        // Ajouter 3 étoiles pour déclencher la pénalité
        for ($i = 0; $i < 3; ++$i) {
            $this->client->request('POST', "/api/sessions/{$sessionId}/star-events", [
                'headers' => ['Content-Type' => 'application/ld+json'],
                'json' => [
                    'player' => $this->getIri($player),
                ],
            ]);
        }

        // Récupérer le détail de la session
        $response = $this->client->request('GET', "/api/sessions/{$sessionId}");
        $data = $response->toArray();

        // Vérifier que les scores cumulés incluent la pénalité
        $this->assertNotEmpty($data['cumulativeScores']);

        $scoresByName = [];
        foreach ($data['cumulativeScores'] as $cs) {
            $scoresByName[$cs['playerName']] = $cs['score'];
        }

        $this->assertSame(-100, $scoresByName[$player->getName()]);

        foreach ($session->getPlayers() as $p) {
            if ($p->getId() !== $player->getId()) {
                $this->assertSame(25, $scoresByName[$p->getName()]);
            }
        }
    }

    public function testStarEventsInSessionDetail(): void
    {
        $this->client->disableReboot();

        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $player = $session->getPlayers()->first();
        $sessionId = $session->getId();

        $this->client->request('POST', "/api/sessions/{$sessionId}/star-events", [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => [
                'player' => $this->getIri($player),
            ],
        ]);

        $response = $this->client->request('GET', "/api/sessions/{$sessionId}");
        $data = $response->toArray();

        $this->assertArrayHasKey('starEvents', $data);
        $this->assertCount(1, $data['starEvents']);
        $this->assertSame($player->getName(), $data['starEvents'][0]['player']['name']);
    }
}
