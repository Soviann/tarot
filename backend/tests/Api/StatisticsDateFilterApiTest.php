<?php

declare(strict_types=1);

namespace App\Tests\Api;

use App\Entity\Game;
use App\Entity\Player;
use App\Entity\ScoreEntry;
use App\Entity\Session;
use App\Enum\Contract;
use App\Enum\GameStatus;

class StatisticsDateFilterApiTest extends ApiTestCase
{
    /** @var Game[] */
    private array $games;

    /** @var Player[] */
    private array $players;

    private Session $session;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedData();
    }

    public function testGlobalStatsFilteredByDateRange(): void
    {
        $response = $this->client->request('GET', '/api/statistics?from=2026-01-01&to=2026-01-31');

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();

        // Only January games (game1 and game2)
        $this->assertSame(2, $data['totalGames']);
    }

    public function testPlayerStatsFilteredByDateRange(): void
    {
        $alice = $this->players['Alice'];

        $response = $this->client->request('GET', '/api/statistics/players/'.$alice->getId().'?from=2026-01-01&to=2026-01-31');

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();

        // Alice has game scores in both January games (game1 as taker, game2 as defender)
        $this->assertSame(2, $data['gamesPlayed']);
        // Alice is taker only in game1 in January
        $this->assertSame(1, $data['gamesAsTaker']);
    }

    public function testDateRangeWithPlayerGroup(): void
    {
        $group = $this->createPlayerGroup('Mardi soir', ...\array_values($this->players));
        $this->session->setPlayerGroup($group);
        $this->em->flush();

        $response = $this->client->request('GET', '/api/statistics?playerGroup='.$group->getId().'&from=2026-01-01&to=2026-01-31');

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();

        // Only January games in this group
        $this->assertSame(2, $data['totalGames']);
    }

    public function testFromOnly(): void
    {
        $response = $this->client->request('GET', '/api/statistics?from=2026-02-01');

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();

        // Only February game (game3)
        $this->assertSame(1, $data['totalGames']);
    }

    public function testToOnly(): void
    {
        $response = $this->client->request('GET', '/api/statistics?to=2026-01-31');

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();

        // Only January games (game1 and game2)
        $this->assertSame(2, $data['totalGames']);
    }

    public function testNoDateFilter(): void
    {
        $response = $this->client->request('GET', '/api/statistics');

        $this->assertResponseIsSuccessful();
        $data = $response->toArray();

        // All 3 games
        $this->assertSame(3, $data['totalGames']);
    }

    /**
     * Seeds:
     * - 5 players: Alice, Bob, Charlie, Diana, Eve
     * - 1 session with all 5 players
     * - Game 1 (January): Petite, Alice taker, Bob partner, 2 oudlers, 45 pts -> attack wins
     * - Game 2 (January): Garde, Charlie taker, Diana partner, 1 oudler, 60 pts -> attack wins
     * - Game 3 (February): Petite, Alice taker, Eve partner, 0 oudlers, 40 pts -> attack loses
     *
     * After creation, completedAt is set via SQL to put games in different months.
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

        // Game 1: Petite, Alice taker, Bob partner, 2 oudlers, 45 pts -> wins
        $this->games['game1'] = $this->createCompletedGame(
            contract: Contract::Petite,
            oudlers: 2,
            partner: $this->players['Bob'],
            points: 45.0,
            position: 1,
            scores: ['Alice' => 58, 'Bob' => 29, 'Charlie' => -29, 'Diana' => -29, 'Eve' => -29],
            taker: $this->players['Alice'],
        );

        // Game 2: Garde, Charlie taker, Diana partner, 1 oudler, 60 pts -> wins
        $this->games['game2'] = $this->createCompletedGame(
            contract: Contract::Garde,
            oudlers: 1,
            partner: $this->players['Diana'],
            points: 60.0,
            position: 2,
            scores: ['Alice' => -68, 'Bob' => -68, 'Charlie' => 136, 'Diana' => 68, 'Eve' => -68],
            taker: $this->players['Charlie'],
        );

        // Game 3: Petite, Alice taker, Eve partner, 0 oudlers, 40 pts -> loses
        $this->games['game3'] = $this->createCompletedGame(
            contract: Contract::Petite,
            oudlers: 0,
            partner: $this->players['Eve'],
            points: 40.0,
            position: 3,
            scores: ['Alice' => -82, 'Bob' => 41, 'Charlie' => 41, 'Diana' => 41, 'Eve' => -41],
            taker: $this->players['Alice'],
        );

        // Set completedAt via SQL: game1 and game2 in January, game3 in February
        $conn = $this->em->getConnection();
        $conn->executeStatement(
            'UPDATE game SET completed_at = ? WHERE id = ?',
            ['2026-01-10 14:00:00', $this->games['game1']->getId()],
        );
        $conn->executeStatement(
            'UPDATE game SET completed_at = ? WHERE id = ?',
            ['2026-01-20 14:00:00', $this->games['game2']->getId()],
        );
        $conn->executeStatement(
            'UPDATE game SET completed_at = ? WHERE id = ?',
            ['2026-02-10 14:00:00', $this->games['game3']->getId()],
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
