<?php

declare(strict_types=1);

namespace App\Tests\Api;

use App\Entity\Game;
use App\Entity\ScoreEntry;
use App\Enum\Contract;
use App\Enum\GameStatus;
use App\Service\Scoring\ScoreCalculator;

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

    public function testListSessionsLimitedToFiveOrderedByLastActivity(): void
    {
        // Créer 6 sessions avec des joueurs distincts
        $sessions = [];
        for ($i = 0; $i < 6; ++$i) {
            $sessions[] = $this->createSessionWithPlayers(
                "P{$i}a", "P{$i}b", "P{$i}c", "P{$i}d", "P{$i}e",
            );
        }

        // Ajouter une donne à la session 2 (index 1) avec une date future
        // pour garantir qu'elle a l'activité la plus récente
        $game = new Game();
        $game->setContract(Contract::Petite);
        $game->setPosition(1);
        $game->setSession($sessions[1]);
        $game->setStatus(GameStatus::Completed);
        $game->setTaker($sessions[1]->getPlayers()->first());
        $this->em->persist($game);
        $this->em->flush();

        // Forcer une date future sur la donne pour un tri déterministe
        $this->em->getConnection()->executeStatement(
            'UPDATE game SET created_at = :date WHERE id = :id',
            ['date' => '2099-01-01 00:00:00', 'id' => $game->getId()],
        );

        $response = $this->client->request('GET', '/api/sessions');

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();

        // Limité à 5 résultats
        $this->assertCount(5, $data['member']);

        // La session avec la donne la plus récente est en premier
        $this->assertSame($sessions[1]->getId(), $data['member'][0]['id']);
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
        $sessionId = $session->getId();

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
        $this->assertArrayHasKey('lastPlayedAt', $member);
        $this->assertArrayHasKey('players', $member);
        $this->assertArrayHasKey('createdAt', $member);
        // Le listing ne contient pas les games ni les scores cumulés
        $this->assertArrayNotHasKey('games', $member);
        $this->assertArrayNotHasKey('cumulativeScores', $member);
    }

    public function testLastPlayedAtEqualsCreatedAtWhenNoGames(): void
    {
        $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');

        $response = $this->client->request('GET', '/api/sessions');

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();
        $member = $data['member'][0];
        $this->assertSame($member['createdAt'], $member['lastPlayedAt']);
    }

    public function testLastPlayedAtReturnsLatestGameDate(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();

        // Créer deux donnes avec des dates différentes
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
        $game2->setStatus(GameStatus::Completed);
        $game2->setTaker($players[1]);
        $this->em->persist($game2);

        $this->em->flush();

        $response = $this->client->request('GET', '/api/sessions');

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();
        $member = $data['member'][0];
        // lastPlayedAt devrait être >= createdAt de la session (la dernière donne)
        $this->assertGreaterThanOrEqual($member['createdAt'], $member['lastPlayedAt']);
    }

    public function testSessionDetailContainsInProgressGame(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();

        // Donne complétée
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
        $calculator = new ScoreCalculator();
        foreach ($calculator->compute($game1) as $entry) {
            $this->em->persist($entry);
            $game1->addScoreEntry($entry);
        }

        // Donne en cours
        $game2 = new Game();
        $game2->setContract(Contract::Garde);
        $game2->setPosition(2);
        $game2->setSession($session);
        $game2->setStatus(GameStatus::InProgress);
        $game2->setTaker($players[2]);
        $this->em->persist($game2);
        $this->em->flush();

        $response = $this->client->request('GET', $this->getIri($session));
        $this->assertResponseIsSuccessful();
        $data = $response->toArray();

        // inProgressGame présent et correct
        $this->assertArrayHasKey('inProgressGame', $data);
        $this->assertSame($game2->getId(), $data['inProgressGame']['id']);
        $this->assertSame('in_progress', $data['inProgressGame']['status']);
        $this->assertSame('garde', $data['inProgressGame']['contract']);

        // games n'est plus sérialisé dans le détail session
        $this->assertArrayNotHasKey('games', $data);
    }

    public function testSessionDetailWithNoInProgressGame(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();

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
        $calculator = new ScoreCalculator();
        foreach ($calculator->compute($game) as $entry) {
            $this->em->persist($entry);
            $game->addScoreEntry($entry);
        }
        $this->em->flush();

        $response = $this->client->request('GET', $this->getIri($session));
        $this->assertResponseIsSuccessful();
        $data = $response->toArray();

        // JSON-LD omet les valeurs null, inProgressGame ne doit pas apparaître
        $this->assertArrayNotHasKey('inProgressGame', $data);
    }

    public function testCloseSession(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');

        $response = $this->client->request('PATCH', $this->getIri($session), [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => ['isActive' => false],
        ]);

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();
        $this->assertFalse($data['isActive']);
    }

    public function testReopenSessionIsPrevented(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $session->setIsActive(false);
        $this->em->flush();

        $this->client->request('PATCH', $this->getIri($session), [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => ['isActive' => true],
        ]);

        $this->assertResponseStatusCodeSame(422);
    }

    public function testGetSessionSummary(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();

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
        $calculator = new ScoreCalculator();
        foreach ($calculator->compute($game) as $entry) {
            $this->em->persist($entry);
            $game->addScoreEntry($entry);
        }
        $this->em->flush();

        $response = $this->client->request('GET', '/api/sessions/'.$session->getId().'/summary');

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();
        $this->assertArrayHasKey('ranking', $data);
        $this->assertArrayHasKey('highlights', $data);
        $this->assertArrayHasKey('awards', $data);
        $this->assertArrayHasKey('scoreSpread', $data);
        $this->assertCount(5, $data['ranking']);
    }

    public function testGetSessionSummary404(): void
    {
        $this->client->request('GET', '/api/sessions/999/summary');
        $this->assertResponseStatusCodeSame(404);
    }

    public function testCloseAllGroupSessions(): void
    {
        $session1 = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $session2 = $this->createSessionWithPlayers('Frank', 'Grace', 'Heidi', 'Ivan', 'Judy');
        $group = $this->createPlayerGroup('Test Group');
        $session1->setPlayerGroup($group);
        $session2->setPlayerGroup($group);
        $this->em->flush();

        $this->client->request('POST', '/api/player-groups/'.$group->getId().'/close-sessions');

        $this->assertResponseIsSuccessful();

        $this->em->clear();
        $s1 = $this->em->find(\App\Entity\Session::class, $session1->getId());
        $s2 = $this->em->find(\App\Entity\Session::class, $session2->getId());
        $this->assertFalse($s1->getIsActive());
        $this->assertFalse($s2->getIsActive());
    }

    public function testCloseAllGroupSessionsIgnoresAlreadyClosed(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $session->setIsActive(false);
        $group = $this->createPlayerGroup('Test Group');
        $session->setPlayerGroup($group);
        $this->em->flush();

        $response = $this->client->request('POST', '/api/player-groups/'.$group->getId().'/close-sessions');

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();
        $this->assertSame(0, $data['closedCount']);
    }

    public function testPatchPlayerOrderValid(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $playerIds = $session->getPlayers()->map(static fn ($p): ?int => $p->getId())->getValues();

        // Reverse the order
        $reversed = \array_reverse($playerIds);

        $response = $this->client->request('PATCH', $this->getIri($session), [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => ['playerOrder' => $reversed],
        ]);

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();
        $this->assertSame($reversed, $data['playerOrder']);
    }

    public function testPatchPlayerOrderInvalidIds(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');

        $this->client->request('PATCH', $this->getIri($session), [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => ['playerOrder' => [999, 998, 997, 996, 995]],
        ]);

        $this->assertResponseStatusCodeSame(422);
    }

    public function testPatchPlayerOrderDuplicates(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $firstId = $session->getPlayers()->first()->getId();

        $this->client->request('PATCH', $this->getIri($session), [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => ['playerOrder' => [$firstId, $firstId, $firstId, $firstId, $firstId]],
        ]);

        $this->assertResponseStatusCodeSame(422);
    }

    public function testPatchPlayerOrderWrongCount(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $playerIds = $session->getPlayers()->map(static fn ($p): ?int => $p->getId())->getValues();

        $this->client->request('PATCH', $this->getIri($session), [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => ['playerOrder' => \array_slice($playerIds, 0, 3)],
        ]);

        $this->assertResponseStatusCodeSame(422);
    }

    public function testPatchPlayerOrderNullResetsOrder(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $playerIds = $session->getPlayers()->map(static fn ($p): ?int => $p->getId())->getValues();

        // Set order first
        $this->client->request('PATCH', $this->getIri($session), [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => ['playerOrder' => \array_reverse($playerIds)],
        ]);
        $this->assertResponseIsSuccessful();

        // Reset to null
        $response = $this->client->request('PATCH', $this->getIri($session), [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => ['playerOrder' => null],
        ]);
        $this->assertResponseIsSuccessful();
        $data = $response->toArray();
        $this->assertNull($data['playerOrder']);
    }

    public function testDealerAdvancesFollowingCustomPlayerOrder(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();
        $playerIds = \array_map(static fn (\App\Entity\Player $p): ?int => $p->getId(), $players);

        // Custom order: reverse (Eve, Diana, Charlie, Bob, Alice)
        $reversed = \array_reverse($playerIds);
        $session->setPlayerOrder($reversed);
        // Eve = first in custom order, set as current dealer
        $session->setCurrentDealer($players[4]); // Eve
        $this->em->flush();

        // Create an in-progress game via entity
        $game = new Game();
        $game->setContract(Contract::Petite);
        $game->setPosition(1);
        $game->setSession($session);
        $game->setStatus(GameStatus::InProgress);
        $game->setTaker($players[0]); // Alice
        $this->em->persist($game);
        $this->em->flush();

        // Complete the game via API PATCH → triggers advanceDealer
        $this->client->request('PATCH', $this->getIri($game), [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => [
                'oudlers' => 2,
                'partner' => $this->getIri($players[1]),
                'points' => 45,
                'status' => 'completed',
            ],
        ]);
        $this->assertResponseIsSuccessful();

        // Dealer should advance: Eve → Diana (second in reversed order)
        $response = $this->client->request('GET', $this->getIri($session));
        $this->assertResponseIsSuccessful();
        $data = $response->toArray();
        $this->assertSame($players[3]->getId(), $data['currentDealer']['id']); // Diana
    }

    public function testCreateSessionSetsInitialPlayerOrder(): void
    {
        $playerIris = $this->createPlayerIris('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');

        $response = $this->client->request('POST', '/api/sessions', [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => ['players' => $playerIris],
        ]);

        $this->assertResponseStatusCodeSame(201);
        $data = $response->toArray();

        // Fetch detail to get playerOrder (session:detail group)
        $detail = $this->client->request('GET', '/api/sessions/'.$data['id'])->toArray();
        $this->assertNotNull($detail['playerOrder']);
        $this->assertCount(5, $detail['playerOrder']);
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
