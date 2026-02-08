<?php

declare(strict_types=1);

namespace App\Tests\Api;

use App\Entity\Game;
use App\Enum\Contract;

class DealerRotationTest extends ApiTestCase
{
    public function testSessionCreationInitializesDealer(): void
    {
        // Créer des joueurs sans les associer à une session existante
        $playerIris = [];
        foreach (['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'] as $name) {
            $player = $this->createPlayer($name);
            $playerIris[] = $this->getIri($player);
        }

        $this->client->disableReboot();

        // Créer une session via l'API
        $response = $this->client->request('POST', '/api/sessions', [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => [
                'players' => $playerIris,
            ],
        ]);

        $this->assertResponseStatusCodeSame(201);
        $sessionId = $response->toArray()['id'];

        // GET detail pour vérifier le dealer
        $detail = $this->client->request('GET', '/api/sessions/'.$sessionId)->toArray();
        $this->assertNotNull($detail['currentDealer']);
        $this->assertSame('Alice', $detail['currentDealer']['name']);
    }

    public function testGameCreationCopiesDealer(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();

        // Initialiser le dealer sur la session
        $session->setCurrentDealer($players[0]); // Alice (alpha order)
        $this->em->flush();

        $response = $this->client->request('POST', $this->getIri($session).'/games', [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => [
                'contract' => 'petite',
                'taker' => $this->getIri($players[1]),
            ],
        ]);

        $this->assertResponseStatusCodeSame(201);
        $data = $response->toArray();
        $this->assertNotNull($data['dealer']);
        $this->assertSame('Alice', $data['dealer']['name']);
    }

    public function testGameCompletionRotatesDealer(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();
        $session->setCurrentDealer($players[0]); // Alice

        $game = new Game();
        $game->setContract(Contract::Petite);
        $game->setDealer($players[0]);
        $game->setPosition(1);
        $game->setSession($session);
        $game->setTaker($players[1]);
        $this->em->persist($game);
        $this->em->flush();

        $this->client->disableReboot();

        // Compléter la donne → rotation
        $this->client->request('PATCH', '/api/games/'.$game->getId(), [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => [
                'oudlers' => 2,
                'partner' => $this->getIri($players[2]),
                'points' => 45,
                'status' => 'completed',
            ],
        ]);

        $this->assertResponseIsSuccessful();

        // Vérifier que le dealer a avancé à Bob
        $detail = $this->client->request('GET', '/api/sessions/'.$session->getId())->toArray();
        $this->assertSame('Bob', $detail['currentDealer']['name']);
    }

    public function testFullRotationCycle(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();
        $session->setCurrentDealer($players[0]); // Alice
        $this->em->flush();

        $this->client->disableReboot();

        $expectedDealers = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];

        // 5 donnes complètes → cycle complet, retour à Alice
        for ($i = 0; $i < 5; ++$i) {
            // Créer une donne
            $response = $this->client->request('POST', $this->getIri($session).'/games', [
                'headers' => ['Content-Type' => 'application/ld+json'],
                'json' => [
                    'contract' => 'petite',
                    'taker' => $this->getIri($players[($i + 1) % 5]),
                ],
            ]);
            $this->assertResponseStatusCodeSame(201);
            $gameData = $response->toArray();

            // Vérifier que la donne a le bon dealer
            $this->assertSame($expectedDealers[$i], $gameData['dealer']['name'], 'Donne #'.($i + 1)." devrait avoir {$expectedDealers[$i]} comme donneur");

            // Compléter
            $this->client->request('PATCH', '/api/games/'.$gameData['id'], [
                'headers' => ['Content-Type' => 'application/merge-patch+json'],
                'json' => [
                    'oudlers' => 2,
                    'points' => 45,
                    'status' => 'completed',
                ],
            ]);
            $this->assertResponseIsSuccessful();
        }

        // Après 5 rotations, retour au premier joueur (Alice)
        $detail = $this->client->request('GET', '/api/sessions/'.$session->getId())->toArray();
        $this->assertSame('Alice', $detail['currentDealer']['name']);
    }

    public function testReEditDoesNotRotateDealerAgain(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();
        $session->setCurrentDealer($players[0]); // Alice

        $game = new Game();
        $game->setContract(Contract::Petite);
        $game->setDealer($players[0]);
        $game->setPosition(1);
        $game->setSession($session);
        $game->setTaker($players[1]);
        $this->em->persist($game);
        $this->em->flush();

        $this->client->disableReboot();

        // Première complétion → rotation de Alice à Bob
        $this->client->request('PATCH', '/api/games/'.$game->getId(), [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => [
                'oudlers' => 2,
                'partner' => $this->getIri($players[2]),
                'points' => 45,
                'status' => 'completed',
            ],
        ]);
        $this->assertResponseIsSuccessful();

        $detail = $this->client->request('GET', '/api/sessions/'.$session->getId())->toArray();
        $this->assertSame('Bob', $detail['currentDealer']['name']);

        // Ré-édition de la même donne → pas de rotation supplémentaire
        $this->client->request('PATCH', '/api/games/'.$game->getId(), [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => [
                'points' => 50,
            ],
        ]);
        $this->assertResponseIsSuccessful();

        $detail = $this->client->request('GET', '/api/sessions/'.$session->getId())->toArray();
        $this->assertSame('Bob', $detail['currentDealer']['name']);
    }

    public function testDeleteGameDoesNotChangeDealer(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();
        $session->setCurrentDealer($players[1]); // Bob

        $game = new Game();
        $game->setContract(Contract::Petite);
        $game->setDealer($players[0]);
        $game->setPosition(1);
        $game->setSession($session);
        $game->setTaker($players[0]);
        $this->em->persist($game);
        $this->em->flush();

        $this->client->disableReboot();

        $this->client->request('DELETE', '/api/games/'.$game->getId());
        $this->assertResponseStatusCodeSame(204);

        // Dealer inchangé
        $detail = $this->client->request('GET', '/api/sessions/'.$session->getId())->toArray();
        $this->assertSame('Bob', $detail['currentDealer']['name']);
    }

    public function testPatchSessionUpdatesDealer(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();
        $session->setCurrentDealer($players[0]); // Alice
        $this->em->flush();

        $this->client->disableReboot();

        // PATCH la session pour changer le donneur à Charlie
        $this->client->request('PATCH', '/api/sessions/'.$session->getId(), [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => [
                'currentDealer' => $this->getIri($players[2]),
            ],
        ]);

        $this->assertResponseIsSuccessful();

        // Vérifier que le donneur est maintenant Charlie
        $detail = $this->client->request('GET', '/api/sessions/'.$session->getId())->toArray();
        $this->assertSame('Charlie', $detail['currentDealer']['name']);
    }

    public function testPatchSessionRejectsNonMemberDealer(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();
        $session->setCurrentDealer($players[0]); // Alice
        $this->em->flush();

        // Créer un joueur hors session
        $outsider = $this->createPlayer('Outsider');

        $this->client->request('PATCH', '/api/sessions/'.$session->getId(), [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => [
                'currentDealer' => $this->getIri($outsider),
            ],
        ]);

        $this->assertResponseStatusCodeSame(422);
    }

    public function testSmartCreatePreservesDealer(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();
        $session->setCurrentDealer($players[2]); // Charlie
        $this->em->flush();

        // Envoyer les mêmes joueurs → smart-create renvoie la session existante
        $playerIris = [];
        foreach ($players as $player) {
            $playerIris[] = $this->getIri($player);
        }

        $this->client->disableReboot();

        $response = $this->client->request('POST', '/api/sessions', [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => [
                'players' => $playerIris,
            ],
        ]);

        $this->assertResponseIsSuccessful();
        $returnedId = $response->toArray()['id'];
        $this->assertSame($session->getId(), $returnedId);

        // Vérifier que le dealer est toujours Charlie
        $detail = $this->client->request('GET', '/api/sessions/'.$returnedId)->toArray();
        $this->assertSame('Charlie', $detail['currentDealer']['name']);
    }
}
