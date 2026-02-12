<?php

declare(strict_types=1);

namespace App\Tests\Api;

use App\Entity\Game;
use App\Entity\Player;
use App\Entity\ScoreEntry;
use App\Entity\Session;
use App\Enum\Contract;
use App\Enum\GameStatus;

class StatisticsApiTest extends ApiTestCase
{
    /** @var Player[] */
    private array $players;

    private Session $session;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedData();
    }

    public function testGetGlobalStatistics(): void
    {
        $response = $this->client->request('GET', '/api/statistics');

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();

        // Structure
        $this->assertArrayHasKey('contractDistribution', $data);
        $this->assertArrayHasKey('leaderboard', $data);
        $this->assertArrayHasKey('totalGames', $data);
        $this->assertArrayHasKey('totalSessions', $data);

        // Totals
        $this->assertSame(3, $data['totalGames']);
        $this->assertSame(1, $data['totalSessions']);

        // Duration stats — seed data has no completedAt, so null/0
        $this->assertArrayHasKey('averageGameDuration', $data);
        $this->assertArrayHasKey('totalPlayTime', $data);
        $this->assertNull($data['averageGameDuration']);
        $this->assertSame(0, $data['totalPlayTime']);

        // Leaderboard — sorted by totalScore DESC
        $this->assertCount(5, $data['leaderboard']);
        $first = $data['leaderboard'][0];
        $this->assertArrayHasKey('gamesAsTaker', $first);
        $this->assertArrayHasKey('gamesPlayed', $first);
        $this->assertArrayHasKey('playerId', $first);
        $this->assertArrayHasKey('playerName', $first);
        $this->assertArrayHasKey('totalScore', $first);
        $this->assertArrayHasKey('winRate', $first);
        $this->assertArrayHasKey('wins', $first);

        // All players should have gamesPlayed = 3
        foreach ($data['leaderboard'] as $entry) {
            $this->assertSame(3, $entry['gamesPlayed']);
        }

        // Contract distribution — 2 petite + 1 garde = 3 total
        $contracts = [];
        foreach ($data['contractDistribution'] as $entry) {
            $contracts[$entry['contract']] = $entry;
        }
        $this->assertArrayHasKey('petite', $contracts);
        $this->assertArrayHasKey('garde', $contracts);
        $this->assertSame(2, $contracts['petite']['count']);
        $this->assertSame(1, $contracts['garde']['count']);
        $this->assertEqualsWithDelta(66.67, $contracts['petite']['percentage'], 0.01);
        $this->assertEqualsWithDelta(33.33, $contracts['garde']['percentage'], 0.01);
    }

    public function testGetGlobalStatisticsEmpty(): void
    {
        // Remove seeded data
        $this->em->createQuery('DELETE FROM App\Entity\ScoreEntry')->execute();
        $this->em->createQuery('DELETE FROM App\Entity\Game')->execute();
        $this->em->createQuery('DELETE FROM App\Entity\Session')->execute();
        $this->em->createQuery('DELETE FROM App\Entity\Player')->execute();

        $response = $this->client->request('GET', '/api/statistics');

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();

        $this->assertSame(0, $data['totalGames']);
        $this->assertSame(0, $data['totalSessions']);
        $this->assertSame([], $data['leaderboard']);
        $this->assertSame([], $data['contractDistribution']);
        $this->assertNull($data['averageGameDuration']);
        $this->assertSame(0, $data['totalPlayTime']);
    }

    public function testGetPlayerStatistics(): void
    {
        $alice = $this->players['Alice'];

        $response = $this->client->request('GET', '/api/statistics/players/'.$alice->getId());

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();

        // Player info
        $this->assertSame($alice->getId(), $data['player']['id']);
        $this->assertSame('Alice', $data['player']['name']);

        // Alice is taker in game1 (petite, won) and game3 (petite, lost)
        $this->assertSame(3, $data['gamesPlayed']);
        $this->assertSame(2, $data['gamesAsTaker']);
        $this->assertSame(1, $data['sessionsPlayed']);

        // Contract distribution for Alice as taker
        $this->assertNotEmpty($data['contractDistribution']);

        // Recent scores
        $this->assertCount(3, $data['recentScores']);
        foreach ($data['recentScores'] as $score) {
            $this->assertArrayHasKey('date', $score);
            $this->assertArrayHasKey('gameId', $score);
            $this->assertArrayHasKey('score', $score);
            $this->assertArrayHasKey('sessionId', $score);
        }

        // Numeric fields present
        $this->assertArrayHasKey('averageScore', $data);
        $this->assertArrayHasKey('bestGameScore', $data);
        $this->assertArrayHasKey('gamesAsDefender', $data);
        $this->assertArrayHasKey('gamesAsPartner', $data);
        $this->assertArrayHasKey('winRateAsTaker', $data);
        $this->assertArrayHasKey('worstGameScore', $data);

        // Duration stats — seed data has no completedAt
        $this->assertArrayHasKey('averageGameDurationSeconds', $data);
        $this->assertArrayHasKey('totalPlayTimeSeconds', $data);
        $this->assertNull($data['averageGameDurationSeconds']);
        $this->assertSame(0, $data['totalPlayTimeSeconds']);
    }

    public function testGetPlayerStatisticsNotFound(): void
    {
        $this->client->request('GET', '/api/statistics/players/99999');

        $this->assertResponseStatusCodeSame(404);
    }

    public function testGlobalStatisticsIncludesEloRanking(): void
    {
        $response = $this->client->request('GET', '/api/statistics');

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();

        $this->assertArrayHasKey('eloRanking', $data);
        $this->assertIsArray($data['eloRanking']);

        // Seed data uses raw entities (no processor), so eloRanking is empty
        $this->assertSame([], $data['eloRanking']);
    }

    public function testPlayerStatisticsIncludesEloData(): void
    {
        $alice = $this->players['Alice'];

        $response = $this->client->request('GET', '/api/statistics/players/'.$alice->getId());

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();

        $this->assertArrayHasKey('eloRating', $data);
        $this->assertSame(1500, $data['eloRating']);
        $this->assertArrayHasKey('eloHistory', $data);
        $this->assertIsArray($data['eloHistory']);
    }

    public function testEloUpdatedAfterGameCompletion(): void
    {
        $this->client->disableReboot();

        // Create a game via API
        $response = $this->client->request('POST', '/api/sessions/'.$this->session->getId().'/games', [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => [
                'contract' => 'petite',
                'taker' => $this->getIri($this->players['Alice']),
            ],
        ]);
        $this->assertResponseStatusCodeSame(201);
        $gameIri = $response->toArray()['@id'];

        // Complete the game
        $this->client->request('PATCH', $gameIri, [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => [
                'oudlers' => 2,
                'partner' => $this->getIri($this->players['Bob']),
                'points' => 45,
                'status' => 'completed',
            ],
        ]);
        $this->assertResponseIsSuccessful();

        // Check ELO has changed
        $response = $this->client->request('GET', '/api/statistics/players/'.$this->players['Alice']->getId());
        $data = $response->toArray();

        $this->assertNotSame(1500, $data['eloRating']);
        $this->assertNotEmpty($data['eloHistory']);

        // ELO ranking should now include players
        $response = $this->client->request('GET', '/api/statistics');
        $globalData = $response->toArray();
        $this->assertNotEmpty($globalData['eloRanking']);

        // Duration stats — the API-created game has completedAt set
        $this->assertIsInt($globalData['averageGameDuration']);
        $this->assertGreaterThanOrEqual(0, $globalData['averageGameDuration']);
        $this->assertIsInt($globalData['totalPlayTime']);
        $this->assertGreaterThanOrEqual(0, $globalData['totalPlayTime']);
    }

    public function testEloRevertedAfterGameDeletion(): void
    {
        $this->client->disableReboot();

        // Create and complete a game via API
        $response = $this->client->request('POST', '/api/sessions/'.$this->session->getId().'/games', [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => [
                'contract' => 'petite',
                'taker' => $this->getIri($this->players['Alice']),
            ],
        ]);
        $this->assertResponseStatusCodeSame(201);
        $gameIri = $response->toArray()['@id'];

        $this->client->request('PATCH', $gameIri, [
            'headers' => ['Content-Type' => 'application/merge-patch+json'],
            'json' => [
                'oudlers' => 2,
                'partner' => $this->getIri($this->players['Bob']),
                'points' => 45,
                'status' => 'completed',
            ],
        ]);
        $this->assertResponseIsSuccessful();

        // Verify ELO changed
        $response = $this->client->request('GET', '/api/statistics/players/'.$this->players['Alice']->getId());
        $eloAfterComplete = $response->toArray()['eloRating'];
        $this->assertNotSame(1500, $eloAfterComplete);

        // Delete the game
        $this->client->request('DELETE', $gameIri);
        $this->assertResponseStatusCodeSame(204);

        // ELO should revert to 1500
        $response = $this->client->request('GET', '/api/statistics/players/'.$this->players['Alice']->getId());
        $data = $response->toArray();
        $this->assertSame(1500, $data['eloRating']);
    }

    /**
     * Seeds:
     * - 5 players: Alice, Bob, Charlie, Diana, Eve
     * - 1 session with all 5 players
     * - Game 1: Petite, Alice taker, Bob partner, 2 oudlers, 45 pts → attack wins
     * - Game 2: Garde, Charlie taker, Diana partner, 1 oudler, 60 pts → attack wins
     * - Game 3: Petite, Alice taker, Eve partner, 0 oudlers, 40 pts → attack loses.
     */
    private function seedData(): void
    {
        $names = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];
        $this->players = [];
        foreach ($names as $name) {
            $this->players[$name] = $this->createPlayer($name);
        }

        $this->session = new Session();
        foreach ($this->players as $player) {
            $this->session->addPlayer($player);
        }
        $this->em->persist($this->session);
        $this->em->flush();

        // Game 1: Petite, Alice taker, Bob partner, 2 oudlers, 45 pts → wins (45 >= 41)
        // base = (45 - 41 + 25) × 1 = 29, taker ×2=58, partner=29, defenders=-29
        $this->createCompletedGame(
            contract: Contract::Petite,
            oudlers: 2,
            partner: $this->players['Bob'],
            points: 45.0,
            position: 1,
            scores: ['Alice' => 58, 'Bob' => 29, 'Charlie' => -29, 'Diana' => -29, 'Eve' => -29],
            taker: $this->players['Alice'],
        );

        // Game 2: Garde, Charlie taker, Diana partner, 1 oudler, 60 pts → wins (60 >= 51)
        // base = (60 - 51 + 25) × 2 = 68, taker ×2=136, partner=68, defenders=-68
        $this->createCompletedGame(
            contract: Contract::Garde,
            oudlers: 1,
            partner: $this->players['Diana'],
            points: 60.0,
            position: 2,
            scores: ['Alice' => -68, 'Bob' => -68, 'Charlie' => 136, 'Diana' => 68, 'Eve' => -68],
            taker: $this->players['Charlie'],
        );

        // Game 3: Petite, Alice taker, Eve partner, 0 oudlers, 40 pts → loses (40 < 56)
        // base = (56 - 40 + 25) × 1 = -41, taker ×2=-82, partner=-41, defenders=41
        $this->createCompletedGame(
            contract: Contract::Petite,
            oudlers: 0,
            partner: $this->players['Eve'],
            points: 40.0,
            position: 3,
            scores: ['Alice' => -82, 'Bob' => 41, 'Charlie' => 41, 'Diana' => 41, 'Eve' => -41],
            taker: $this->players['Alice'],
        );
    }

    /**
     * @param array<string, int> $scores
     */
    private function createCompletedGame(
        Contract $contract,
        int $oudlers,
        Player $partner,
        float $points,
        int $position,
        array $scores,
        Player $taker,
    ): Game {
        $game = new Game();
        $game->setContract($contract);
        $game->setOudlers($oudlers);
        $game->setPartner($partner);
        $game->setPoints($points);
        $game->setPosition($position);
        $game->setSession($this->session);
        $game->setStatus(GameStatus::Completed);
        $game->setTaker($taker);
        $this->em->persist($game);

        foreach ($scores as $name => $score) {
            $entry = new ScoreEntry();
            $entry->setGame($game);
            $entry->setPlayer($this->players[$name]);
            $entry->setScore($score);
            $this->em->persist($entry);
        }

        $this->em->flush();

        return $game;
    }
}
