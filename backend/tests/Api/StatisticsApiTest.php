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
        $this->assertSame([], $data['contractSuccessRateByPlayer']);
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

    public function testGlobalStatisticsFilteredByGroup(): void
    {
        $group = $this->createPlayerGroup('Mardi soir', ...array_values($this->players));
        $this->session->setPlayerGroup($group);
        $this->em->flush();

        // Create a second session WITHOUT the group
        $this->createSessionWithPlayers('Frank', 'Grace', 'Hank', 'Ivy', 'Jack');

        $response = $this->client->request('GET', '/api/statistics?playerGroup='.$group->getId());

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();

        // Only games from the grouped session
        $this->assertSame(3, $data['totalGames']);
        $this->assertSame(1, $data['totalSessions']);
    }

    public function testPlayerStatisticsFilteredByGroup(): void
    {
        $group = $this->createPlayerGroup('Mardi soir', ...array_values($this->players));
        $this->session->setPlayerGroup($group);
        $this->em->flush();

        $alice = $this->players['Alice'];
        $response = $this->client->request('GET', '/api/statistics/players/'.$alice->getId().'?playerGroup='.$group->getId());

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();
        $this->assertSame(3, $data['gamesPlayed']);
    }

    public function testStatisticsIncludePlayerColor(): void
    {
        // Set Alice's color
        $alice = $this->players['Alice'];
        $alice->setColor('#ef4444');
        $this->em->flush();

        $this->client->disableReboot();

        // Create and complete a game via API to trigger ELO
        $response = $this->client->request('POST', '/api/sessions/'.$this->session->getId().'/games', [
            'headers' => ['Content-Type' => 'application/ld+json'],
            'json' => [
                'contract' => 'petite',
                'taker' => $this->getIri($alice),
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

        $response = $this->client->request('GET', '/api/statistics');
        $this->assertResponseIsSuccessful();
        $data = $response->toArray();

        // Check leaderboard includes playerColor
        $aliceEntry = null;
        foreach ($data['leaderboard'] as $entry) {
            if ('Alice' === $entry['playerName']) {
                $aliceEntry = $entry;
                break;
            }
        }
        $this->assertNotNull($aliceEntry);
        $this->assertSame('#ef4444', $aliceEntry['playerColor']);

        // Check eloRanking includes playerColor
        $aliceElo = null;
        foreach ($data['eloRanking'] as $entry) {
            if ('Alice' === $entry['playerName']) {
                $aliceElo = $entry;
                break;
            }
        }
        $this->assertNotNull($aliceElo);
        $this->assertSame('#ef4444', $aliceElo['playerColor']);
    }

    public function testGlobalStatisticsIncludesEloEvolution(): void
    {
        $this->client->disableReboot();

        // Create and complete a game via API to trigger ELO history entries
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

        $response = $this->client->request('GET', '/api/statistics');
        $this->assertResponseIsSuccessful();
        $data = $response->toArray();

        $this->assertArrayHasKey('eloEvolution', $data);
        $this->assertIsArray($data['eloEvolution']);
        $this->assertNotEmpty($data['eloEvolution']);

        // Each entry should have player info + history array
        $firstPlayer = $data['eloEvolution'][0];
        $this->assertArrayHasKey('history', $firstPlayer);
        $this->assertArrayHasKey('playerColor', $firstPlayer);
        $this->assertArrayHasKey('playerId', $firstPlayer);
        $this->assertArrayHasKey('playerName', $firstPlayer);

        $this->assertNotEmpty($firstPlayer['history']);
        $firstEntry = $firstPlayer['history'][0];
        $this->assertArrayHasKey('date', $firstEntry);
        $this->assertArrayHasKey('gameId', $firstEntry);
        $this->assertArrayHasKey('ratingAfter', $firstEntry);
    }

    public function testGlobalStatisticsEloEvolutionEmptyWithoutEloHistory(): void
    {
        // Seed data has no ELO history (games created directly, not via API processor)
        $response = $this->client->request('GET', '/api/statistics');

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();

        $this->assertArrayHasKey('eloEvolution', $data);
        $this->assertSame([], $data['eloEvolution']);
    }

    public function testGlobalStatisticsIncludesContractSuccessRateByPlayer(): void
    {
        $response = $this->client->request('GET', '/api/statistics');

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();

        $this->assertArrayHasKey('contractSuccessRateByPlayer', $data);
        $this->assertIsArray($data['contractSuccessRateByPlayer']);

        // Seed data: Alice taker 2× petite (1 win, 1 loss), Charlie taker 1× garde (1 win)
        $this->assertCount(2, $data['contractSuccessRateByPlayer']);

        $byName = [];
        foreach ($data['contractSuccessRateByPlayer'] as $entry) {
            $this->assertArrayHasKey('color', $entry);
            $this->assertArrayHasKey('contracts', $entry);
            $this->assertArrayHasKey('id', $entry);
            $this->assertArrayHasKey('name', $entry);
            $byName[$entry['name']] = $entry;
        }

        // Alice: petite → 2 games, 1 win, 50% win rate
        $this->assertArrayHasKey('Alice', $byName);
        $aliceContracts = [];
        foreach ($byName['Alice']['contracts'] as $c) {
            $aliceContracts[$c['contract']] = $c;
        }
        $this->assertArrayHasKey('petite', $aliceContracts);
        $this->assertSame(2, $aliceContracts['petite']['count']);
        $this->assertSame(1, $aliceContracts['petite']['wins']);
        $this->assertEqualsWithDelta(50.0, $aliceContracts['petite']['winRate'], 0.1);

        // Charlie: garde → 1 game, 1 win, 100% win rate
        $this->assertArrayHasKey('Charlie', $byName);
        $charlieContracts = [];
        foreach ($byName['Charlie']['contracts'] as $c) {
            $charlieContracts[$c['contract']] = $c;
        }
        $this->assertArrayHasKey('garde', $charlieContracts);
        $this->assertSame(1, $charlieContracts['garde']['count']);
        $this->assertSame(1, $charlieContracts['garde']['wins']);
        $this->assertEqualsWithDelta(100.0, $charlieContracts['garde']['winRate'], 0.1);
    }

    public function testContractSuccessRateByPlayerEmptyWhenNoGames(): void
    {
        $this->em->createQuery('DELETE FROM App\Entity\ScoreEntry')->execute();
        $this->em->createQuery('DELETE FROM App\Entity\Game')->execute();

        $response = $this->client->request('GET', '/api/statistics');

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();

        $this->assertSame([], $data['contractSuccessRateByPlayer']);
    }

    public function testPlayerStatisticsIncludesRecords(): void
    {
        $alice = $this->players['Alice'];
        $response = $this->client->request('GET', '/api/statistics/players/'.$alice->getId());
        $this->assertResponseIsSuccessful();
        $data = $response->toArray();

        $this->assertArrayHasKey('records', $data);
        $this->assertIsArray($data['records']);

        $records = [];
        foreach ($data['records'] as $r) {
            $records[$r['type']] = $r;
        }

        // Best score: 58 from game1 (petite, session1)
        $this->assertArrayHasKey('best_score', $records);
        $this->assertSame(58, $records['best_score']['value']);
        $this->assertSame('petite', $records['best_score']['contract']);
        $this->assertSame($this->session->getId(), $records['best_score']['sessionId']);
        $this->assertArrayHasKey('date', $records['best_score']);

        // Worst score: -82 from game3 (petite)
        $this->assertArrayHasKey('worst_score', $records);
        $this->assertSame(-82, $records['worst_score']['value']);
        $this->assertSame('petite', $records['worst_score']['contract']);

        // Win streak as taker: 1 (game1 won, game3 lost — not consecutive)
        $this->assertArrayHasKey('win_streak', $records);
        $this->assertSame(1, $records['win_streak']['value']);

        // Best session total: 58 + (-68) + (-82) = -92
        $this->assertArrayHasKey('best_session', $records);
        $this->assertSame(-92, $records['best_session']['value']);
        $this->assertSame($this->session->getId(), $records['best_session']['sessionId']);

        // Biggest diff as taker: |40 - 56| = 16 (game3, 0 oudlers)
        $this->assertArrayHasKey('biggest_diff', $records);
        $this->assertEqualsWithDelta(16.0, $records['biggest_diff']['value'], 0.01);
        $this->assertSame('petite', $records['biggest_diff']['contract']);
    }

    public function testPlayerRecordsEmptyWhenNoGames(): void
    {
        $this->em->createQuery('DELETE FROM App\Entity\ScoreEntry')->execute();
        $this->em->createQuery('DELETE FROM App\Entity\Game')->execute();

        $alice = $this->players['Alice'];
        $response = $this->client->request('GET', '/api/statistics/players/'.$alice->getId());
        $this->assertResponseIsSuccessful();
        $data = $response->toArray();

        $this->assertSame([], $data['records']);
    }

    public function testGlobalStatisticsWithNonExistentGroup(): void
    {
        $response = $this->client->request('GET', '/api/statistics?playerGroup=99999');

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();
        $this->assertSame(0, $data['totalGames']);
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
