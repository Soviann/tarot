<?php

declare(strict_types=1);

namespace App\Tests\Api;

use App\Entity\Game;
use App\Entity\ScoreEntry;
use App\Enum\Contract;
use App\Enum\GameStatus;

class SessionApiTest extends ApiTestCase
{
    public function testListSessions(): void
    {
        $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $this->createSessionWithPlayers('Frank', 'Grace', 'Heidi', 'Ivan', 'Judy');

        $this->client->request('GET', '/api/sessions');

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['totalItems' => 2]);
    }

    public function testCreateSession(): void
    {
        $playerIris = $this->createPlayerIris('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');

        $response = $this->client->request('POST', '/api/sessions', [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => ['players' => $playerIris],
        ]);

        $this->assertResponseStatusCodeSame(201);
        $data = $response->toArray();
        $this->assertArrayHasKey('id', $data);
        $this->assertArrayHasKey('createdAt', $data);
        $this->assertCount(5, $data['players']);
    }

    public function testSmartCreateReturnsExistingSession(): void
    {
        // Créer la session directement pour garantir l'état initial
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $sessionId = $session->getId()->toString();

        // Récupérer les IRIs des joueurs de la session
        $playerIris = [];
        foreach ($session->getPlayers() as $player) {
            $playerIris[] = $this->getIri($player);
        }

        // POST avec les mêmes joueurs → retourne la session existante
        $response = $this->client->request('POST', '/api/sessions', [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => ['players' => $playerIris],
        ]);
        $this->assertResponseIsSuccessful();
        $this->assertSame($sessionId, $response->toArray()['id']);
    }

    public function testCreateSessionWithInvalidPlayerCount(): void
    {
        $playerIris = $this->createPlayerIris('Alice', 'Bob', 'Charlie');

        $this->client->request('POST', '/api/sessions', [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => ['players' => $playerIris],
        ]);

        $this->assertResponseStatusCodeSame(422);
    }

    public function testSessionDetailWithCumulativeScores(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();

        // Créer une donne complétée avec des scores
        $game = new Game();
        $game->setContract(Contract::Petite);
        $game->setOudlers(2);
        $game->setPartner($players[1]);
        $game->setPoints(45);
        $game->setPosition(1);
        $game->setSession($session);
        $game->setStatus(GameStatus::Completed);
        $game->setTaker($players[0]);
        $this->em->persist($game);

        // Score = base 29. Preneur ×2=58, partenaire=29, défenseurs=-29
        foreach ($players as $i => $player) {
            $entry = new ScoreEntry();
            $entry->setGame($game);
            $entry->setPlayer($player);
            $entry->setScore(match ($i) {
                0 => 58,
                1 => 29,
                default => -29,
            });
            $this->em->persist($entry);
        }
        $this->em->flush();

        $response = $this->client->request('GET', $this->getIri($session));

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();
        $this->assertArrayHasKey('cumulativeScores', $data);
        $this->assertCount(5, $data['cumulativeScores']);

        // Vérifier les scores cumulés
        $scoresByName = [];
        foreach ($data['cumulativeScores'] as $entry) {
            $scoresByName[$entry['playerName']] = $entry['score'];
        }
        $this->assertSame(58, $scoresByName['Alice']);
        $this->assertSame(29, $scoresByName['Bob']);
        $this->assertSame(-29, $scoresByName['Charlie']);
    }

    public function testSessionListShowsBasicInfo(): void
    {
        $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');

        $response = $this->client->request('GET', '/api/sessions');

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();
        $member = $data['member'][0];
        $this->assertArrayHasKey('id', $member);
        $this->assertArrayHasKey('players', $member);
        $this->assertArrayHasKey('createdAt', $member);
        // Le listing ne contient pas les games ni les scores cumulés
        $this->assertArrayNotHasKey('games', $member);
        $this->assertArrayNotHasKey('cumulativeScores', $member);
    }

    /**
     * @return string[]
     */
    private function createPlayerIris(string ...$names): array
    {
        $iris = [];
        foreach ($names as $name) {
            $iris[] = $this->getIri($this->createPlayer($name));
        }

        return $iris;
    }
}
