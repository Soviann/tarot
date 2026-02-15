<?php

declare(strict_types=1);

namespace App\Tests\Api;

use App\Entity\Game;
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
        $game->setStatus(GameStatus::Completed);
        $game->setTaker($players[0]);
        $this->em->persist($game);
        $this->em->flush();

        $response = $this->client->request('GET', $this->getIri($session).'/games');

        $this->assertResponseIsSuccessful();
        $this->assertJsonContains(['totalItems' => 1]);
    }

    public function testListGamesExcludesInProgress(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();

        // Donne complétée
        $game1 = new Game();
        $game1->setContract(Contract::Petite);
        $game1->setPosition(1);
        $game1->setSession($session);
        $game1->setStatus(GameStatus::Completed);
        $game1->setTaker($players[0]);
        $this->em->persist($game1);

        // Donne en cours
        $game2 = new Game();
        $game2->setContract(Contract::Garde);
        $game2->setPosition(2);
        $game2->setSession($session);
        $game2->setStatus(GameStatus::InProgress);
        $game2->setTaker($players[1]);
        $this->em->persist($game2);
        $this->em->flush();

        $response = $this->client->request('GET', $this->getIri($session).'/games');

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();
        $this->assertSame(1, $data['totalItems']);
        $this->assertSame($game1->getId(), $data['member'][0]['id']);
    }

    public function testListGamesPagination(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();

        // Créer 12 donnes complétées
        for ($i = 1; $i <= 12; ++$i) {
            $game = new Game();
            $game->setContract(Contract::Petite);
            $game->setPosition($i);
            $game->setSession($session);
            $game->setStatus(GameStatus::Completed);
            $game->setTaker($players[$i % 5]);
            $this->em->persist($game);
        }
        $this->em->flush();

        // Page 1 : 10 items, triés par position DESC
        $response = $this->client->request('GET', $this->getIri($session).'/games');
        $this->assertResponseIsSuccessful();
        $data = $response->toArray();
        $this->assertSame(12, $data['totalItems']);
        $this->assertCount(10, $data['member']);
        $this->assertSame(12, $data['member'][0]['position']);
        $this->assertSame(3, $data['member'][9]['position']);

        // Page 2 : 2 items restants
        $response = $this->client->request('GET', $this->getIri($session).'/games?page=2');
        $this->assertResponseIsSuccessful();
        $data = $response->toArray();
        $this->assertCount(2, $data['member']);
        $this->assertSame(2, $data['member'][0]['position']);
        $this->assertSame(1, $data['member'][1]['position']);
    }

    public function testListGamesOrderedByPositionDesc(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();

        for ($i = 1; $i <= 3; ++$i) {
            $game = new Game();
            $game->setContract(Contract::Petite);
            $game->setPosition($i);
            $game->setSession($session);
            $game->setStatus(GameStatus::Completed);
            $game->setTaker($players[0]);
            $this->em->persist($game);
        }
        $this->em->flush();

        $response = $this->client->request('GET', $this->getIri($session).'/games');
        $this->assertResponseIsSuccessful();
        $data = $response->toArray();

        $this->assertSame(3, $data['member'][0]['position']);
        $this->assertSame(2, $data['member'][1]['position']);
        $this->assertSame(1, $data['member'][2]['position']);
    }

    public function testCreateGameStep1(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $taker = $session->getPlayers()->first();

        $response = $this->client->request('POST', $this->getIri($session).'/games', [
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
        $this->assertNull($data['completedAt']);
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
        $response = $this->client->request('POST', $this->getIri($session).'/games', [
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
        $this->client->request('POST', $this->getIri($session).'/games', [
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

        $response = $this->client->request('GET', '/api/games/'.$game->getId());

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

        $response = $this->client->request('PATCH', '/api/games/'.$game->getId(), [
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
        $this->assertNotNull($data['completedAt']);
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
        $calculator = new \App\Service\Scoring\ScoreCalculator();
        foreach ($calculator->compute($game) as $entry) {
            $this->em->persist($entry);
            $game->addScoreEntry($entry);
        }
        $this->em->flush();

        // Modifier les points → recalcul
        $response = $this->client->request('PATCH', '/api/games/'.$game->getId(), [
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

    public function testCompletedAtDoesNotChangeOnEdit(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();

        $this->client->disableReboot();

        // Créer et compléter une donne
        $response = $this->client->request('POST', $this->getIri($session).'/games', [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => [
                'contract' => 'petite',
                'taker' => $this->getIri($players[0]),
            ],
        ]);
        $gameIri = $response->toArray()['@id'];

        $response = $this->client->request('PATCH', $gameIri, [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => [
                'oudlers' => 2,
                'partner' => $this->getIri($players[1]),
                'points' => 45,
                'status' => 'completed',
            ],
        ]);
        $completedAt = $response->toArray()['completedAt'];
        $this->assertNotNull($completedAt);

        // Modifier la donne → completedAt ne change pas
        $response = $this->client->request('PATCH', $gameIri, [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => [
                'points' => 50,
            ],
        ]);
        $this->assertResponseIsSuccessful();
        $this->assertSame($completedAt, $response->toArray()['completedAt']);
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
        $this->client->request('PATCH', '/api/games/'.$game1->getId(), [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => ['points' => 50],
        ]);

        $this->assertResponseStatusCodeSame(422);
    }

    // ---------------------------------------------------------------
    // Chunk 5 : suppression
    // ---------------------------------------------------------------

    public function testDeleteLastCompletedGame(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();

        // Première donne complétée avec scores
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
        $calculator = new \App\Service\Scoring\ScoreCalculator();
        foreach ($calculator->compute($game1) as $entry) {
            $this->em->persist($entry);
            $game1->addScoreEntry($entry);
        }

        // Deuxième donne complétée avec scores
        $game2 = new Game();
        $game2->setContract(Contract::Garde);
        $game2->setOudlers(1);
        $game2->setPartner($players[2]);
        $game2->setPoints(60);
        $game2->setPosition(2);
        $game2->setSession($session);
        $game2->setStatus(GameStatus::Completed);
        $game2->setTaker($players[1]);
        $this->em->persist($game2);
        foreach ($calculator->compute($game2) as $entry) {
            $this->em->persist($entry);
            $game2->addScoreEntry($entry);
        }
        $this->em->flush();

        $this->client->disableReboot();

        // Supprimer la dernière donne → 204
        $this->client->request('DELETE', '/api/games/'.$game2->getId());
        $this->assertResponseStatusCodeSame(204);

        // Vérifier que la donne est bien supprimée
        $this->client->request('GET', '/api/games/'.$game2->getId());
        $this->assertResponseStatusCodeSame(404);

        // Vérifier que le sub-resource ne contient plus que la première donne
        $response = $this->client->request('GET', '/api/sessions/'.$session->getId().'/games');
        $sessionData = $response->toArray();
        $this->assertSame(1, $sessionData['totalItems']);
        $this->assertSame($game1->getId(), $sessionData['member'][0]['id']);
    }

    public function testCannotDeleteNonLastGame(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();

        $game1 = new Game();
        $game1->setContract(Contract::Petite);
        $game1->setPosition(1);
        $game1->setSession($session);
        $game1->setStatus(GameStatus::Completed);
        $game1->setTaker($players[0]);
        $this->em->persist($game1);

        $game2 = new Game();
        $game2->setContract(Contract::Garde);
        $game2->setPosition(2);
        $game2->setSession($session);
        $game2->setTaker($players[1]);
        $this->em->persist($game2);
        $this->em->flush();

        // Tenter de supprimer la première donne → 422
        $this->client->request('DELETE', '/api/games/'.$game1->getId());
        $this->assertResponseStatusCodeSame(422);
    }

    public function testDeleteInProgressGame(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();

        // Première donne complétée
        $game1 = new Game();
        $game1->setContract(Contract::Petite);
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

        $this->client->request('DELETE', '/api/games/'.$game2->getId());
        $this->assertResponseStatusCodeSame(204);
    }

    public function testDeleteOnlyGameInSession(): void
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

        $this->client->disableReboot();

        $this->client->request('DELETE', '/api/games/'.$game->getId());
        $this->assertResponseStatusCodeSame(204);

        // Session vide
        $response = $this->client->request('GET', '/api/sessions/'.$session->getId().'/games');
        $sessionData = $response->toArray();
        $this->assertSame(0, $sessionData['totalItems']);
    }

    public function testCannotCreateGameOnClosedSession(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $session->setIsActive(false);
        $this->em->flush();
        $players = $session->getPlayers()->toArray();

        $this->client->request('POST', $this->getIri($session).'/games', [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => [
                'contract' => 'petite',
                'taker' => $this->getIri($players[0]),
            ],
        ]);

        $this->assertResponseStatusCodeSame(422);
    }

    public function testTakerMustBelongToSession(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $outsidePlayer = $this->createPlayer('Frank');

        $this->client->request('POST', $this->getIri($session).'/games', [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => [
                'contract' => 'petite',
                'taker' => $this->getIri($outsidePlayer),
            ],
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

        $this->client->request('PATCH', '/api/games/'.$game->getId(), [
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
