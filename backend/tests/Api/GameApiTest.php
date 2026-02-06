<?php

declare(strict_types=1);

namespace App\Tests\Api;

use App\Entity\Game;
use App\Entity\ScoreEntry;
use App\Enum\Contract;
use App\Enum\GameStatus;

class GameApiTest extends ApiTestCase
{
    public function testListGamesForSession(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();

        $game = new Game();
        $game->setContract(Contract::Petite);
        $game->setPosition(1);
        $game->setSession($session);
        $game->setTaker($players[0]);
        $this->em->persist($game);
        $this->em->flush();

        $response = $this->client->request('GET', $this->getIri($session) . '/games');

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['totalItems' => 1]);
    }

    public function testCreateGameStep1(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $taker = $session->getPlayers()->first();

        $response = $this->client->request('POST', $this->getIri($session) . '/games', [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => [
                'contract' => 'petite',
                'taker' => $this->getIri($taker),
            ],
        ]);

        $this->assertResponseStatusCodeSame(201);
        $data = $response->toArray();
        $this->assertSame(1, $data['position']);
        $this->assertSame('in_progress', $data['status']);
    }

    public function testPositionAutoIncrements(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();

        // Créer une première donne complétée
        $game1 = new Game();
        $game1->setContract(Contract::Petite);
        $game1->setPosition(1);
        $game1->setSession($session);
        $game1->setStatus(GameStatus::Completed);
        $game1->setTaker($players[0]);
        $this->em->persist($game1);
        $this->em->flush();

        // Créer une deuxième donne via l'API
        $response = $this->client->request('POST', $this->getIri($session) . '/games', [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => [
                'contract' => 'garde',
                'taker' => $this->getIri($players[1]),
            ],
        ]);

        $this->assertResponseStatusCodeSame(201);
        $data = $response->toArray();
        $this->assertSame(2, $data['position']);
    }

    public function testCannotCreateGameIfOneInProgress(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();

        // Créer une donne en cours
        $game = new Game();
        $game->setContract(Contract::Petite);
        $game->setPosition(1);
        $game->setSession($session);
        $game->setTaker($players[0]);
        $this->em->persist($game);
        $this->em->flush();

        // Tenter d'en créer une deuxième → 422
        $this->client->request('POST', $this->getIri($session) . '/games', [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => [
                'contract' => 'garde',
                'taker' => $this->getIri($players[1]),
            ],
        ]);

        $this->assertResponseStatusCodeSame(422);
    }

    public function testGetGameDetail(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();

        $game = new Game();
        $game->setContract(Contract::Petite);
        $game->setPosition(1);
        $game->setSession($session);
        $game->setTaker($players[0]);
        $this->em->persist($game);
        $this->em->flush();

        $response = $this->client->request('GET', '/api/games/' . $game->getId());

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();
        $this->assertSame('petite', $data['contract']);
        $this->assertSame(1, $data['position']);
    }

    // ---------------------------------------------------------------
    // Chunk 4 : complétion + édition
    // ---------------------------------------------------------------

    public function testCompleteGame(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();

        $game = new Game();
        $game->setContract(Contract::Petite);
        $game->setPosition(1);
        $game->setSession($session);
        $game->setTaker($players[0]);
        $this->em->persist($game);
        $this->em->flush();

        $response = $this->client->request('PATCH', '/api/games/' . $game->getId(), [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => [
                'oudlers' => 2,
                'partner' => $this->getIri($players[1]),
                'points' => 45,
                'status' => 'completed',
            ],
        ]);

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();
        $this->assertSame('completed', $data['status']);
        $this->assertCount(5, $data['scoreEntries']);

        // Vérifier les scores (Petite, 2 oudlers, 45 pts → base=29, preneur×2=58)
        $scores = [];
        foreach ($data['scoreEntries'] as $entry) {
            $scores[$entry['player']['name']] = $entry['score'];
        }
        $this->assertSame(58, $scores['Alice']); // Preneur
        $this->assertSame(29, $scores['Bob']); // Partenaire
    }

    public function testEditCompletedGameRecalculatesScores(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();

        // Créer et compléter une donne
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
        // Ajouter les scores initiaux
        $calculator = new \App\Service\ScoreCalculator();
        foreach ($calculator->compute($game) as $entry) {
            $this->em->persist($entry);
            $game->addScoreEntry($entry);
        }
        $this->em->flush();

        // Modifier les points → recalcul
        $response = $this->client->request('PATCH', '/api/games/' . $game->getId(), [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => [
                'points' => 50,
            ],
        ]);

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();
        $this->assertCount(5, $data['scoreEntries']);

        // Petite, 2 oudlers, 50 pts → base=(50-41+25)×1=34, preneur×2=68
        $scores = [];
        foreach ($data['scoreEntries'] as $entry) {
            $scores[$entry['player']['name']] = $entry['score'];
        }
        $this->assertSame(68, $scores['Alice']);
    }

    public function testOnlyLastGameEditable(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();

        // Première donne complétée
        $game1 = new Game();
        $game1->setContract(Contract::Petite);
        $game1->setOudlers(2);
        $game1->setPartner($players[1]);
        $game1->setPoints(45);
        $game1->setPosition(1);
        $game1->setSession($session);
        $game1->setStatus(GameStatus::Completed);
        $game1->setTaker($players[0]);
        $this->em->persist($game1);

        // Deuxième donne en cours
        $game2 = new Game();
        $game2->setContract(Contract::Garde);
        $game2->setPosition(2);
        $game2->setSession($session);
        $game2->setTaker($players[1]);
        $this->em->persist($game2);
        $this->em->flush();

        // Tenter d'éditer la première donne → 422
        $this->client->request('PATCH', '/api/games/' . $game1->getId(), [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => ['points' => 50],
        ]);

        $this->assertResponseStatusCodeSame(422);
    }

    public function testPartnerMustBelongToSession(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $outsidePlayer = $this->createPlayer('Frank');

        $game = new Game();
        $game->setContract(Contract::Petite);
        $game->setPosition(1);
        $game->setSession($session);
        $game->setTaker($session->getPlayers()->first());
        $this->em->persist($game);
        $this->em->flush();

        $this->client->request('PATCH', '/api/games/' . $game->getId(), [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => [
                'oudlers' => 2,
                'partner' => $this->getIri($outsidePlayer),
                'points' => 45,
                'status' => 'completed',
            ],
        ]);

        $this->assertResponseStatusCodeSame(422);
    }
}
