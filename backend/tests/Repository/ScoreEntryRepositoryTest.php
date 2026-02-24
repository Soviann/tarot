<?php

declare(strict_types=1);

namespace App\Tests\Repository;

use App\Dto\DateRange;
use App\Entity\Player;
use App\Entity\ScoreEntry;
use App\Entity\Session;
use App\Repository\ScoreEntryRepository;
use App\Tests\Api\ApiTestCase;

class ScoreEntryRepositoryTest extends ApiTestCase
{
    private ScoreEntryRepository $repo;

    protected function setUp(): void
    {
        parent::setUp();

        /** @var ScoreEntryRepository $repo */
        $repo = $this->em->getRepository(ScoreEntry::class);
        $this->repo = $repo;
    }

    public function testFindBestTakerGameForSession(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();

        self::assertNull($this->repo->findBestTakerGameForSession($session));

        $this->completeGame($session, $players[0], takerScore: 200);
        $this->completeGame($session, $players[1], takerScore: 500);
        $this->completeGame($session, $players[2], takerScore: -100);

        $best = $this->repo->findBestTakerGameForSession($session);
        self::assertNotNull($best);
        self::assertSame(500, $best->score);
        self::assertSame('B', $best->playerName);
    }

    public function testFindWorstTakerGameForSession(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();

        self::assertNull($this->repo->findWorstTakerGameForSession($session));

        $this->completeGame($session, $players[0], takerScore: 200);
        $this->completeGame($session, $players[1], takerScore: -300);

        $worst = $this->repo->findWorstTakerGameForSession($session);
        self::assertNotNull($worst);
        self::assertSame(-300, $worst->score);
    }

    public function testGetCumulativeScoresForSession(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();

        $this->completeGame($session, $players[0], takerScore: 200);
        $this->completeGame($session, $players[1], takerScore: 100);

        $scores = $this->repo->getCumulativeScoresForSession($session);
        self::assertCount(5, $scores);

        // Each player should have a cumulative score
        foreach ($scores as $dto) {
            self::assertIsInt($dto->score);
        }
    }

    public function testGetCompletedGameScoresByPlayer(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();

        $this->completeGame($session, $players[0], takerScore: 200);
        $this->completeGame($session, $players[0], takerScore: 100);

        $scoreMap = $this->repo->getCompletedGameScoresByPlayer($session);

        // Taker (player 0) should have 200 + 100 = 300
        self::assertSame(300, $scoreMap[$players[0]->getId()]);
    }

    public function testGetStarPenaltyScoresByPlayer(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();

        // Create a star penalty score entry (no game, just session)
        $entry = new ScoreEntry();
        $entry->setPlayer($players[0]);
        $entry->setSession($session);
        $entry->setScore(-100);
        $this->em->persist($entry);
        $this->em->flush();

        $penalties = $this->repo->getStarPenaltyScoresByPlayer($session);

        self::assertSame(-100, $penalties[$players[0]->getId()]);
    }

    public function testGetOrderedGameScoresPerPlayerForSession(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();

        $this->completeGame($session, $players[0], takerScore: 200);
        $this->completeGame($session, $players[1], takerScore: -100);

        $map = $this->repo->getOrderedGameScoresPerPlayerForSession($session);

        // Each player participated in both games
        self::assertCount(2, $map[$players[0]->getId()]);
    }

    public function testGetTotalTakerScoreByPlayerForSession(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();

        self::assertNull($this->repo->getTotalTakerScoreByPlayerForSession($session));

        $this->completeGame($session, $players[0], takerScore: 200);
        $this->completeGame($session, $players[0], takerScore: 300);
        $this->completeGame($session, $players[1], takerScore: 100);

        $result = $this->repo->getTotalTakerScoreByPlayerForSession($session);
        self::assertNotNull($result);
        // Player 0 has 200 + 300 = 500, highest
        self::assertSame($players[0]->getId(), $result->playerId);
        self::assertSame(500, $result->totalTakerScore);
    }

    public function testGetLeaderboardScores(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();

        $this->completeGame($session, $players[0], takerScore: 400);

        $rows = $this->repo->getLeaderboardScores();
        self::assertNotEmpty($rows);

        // Player 0 (taker) should be at top
        self::assertSame($players[0]->getId(), $rows[0]->playerId);
        self::assertSame(400, $rows[0]->totalScore);
    }

    public function testGetLeaderboardScoresWithDateRange(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();

        $past = new \DateTimeImmutable('2025-01-01');
        $recent = new \DateTimeImmutable('2026-02-20');

        $this->completeGame($session, $players[0], takerScore: 400, completedAt: $past);
        $this->completeGame($session, $players[1], takerScore: 200, completedAt: $recent);

        $dateRange = new DateRange(new \DateTimeImmutable('2026-01-01'));
        $rows = $this->repo->getLeaderboardScores($dateRange);

        // Only the recent game's scores should be counted
        self::assertNotEmpty($rows);
        $p1Score = null;
        foreach ($rows as $row) {
            if ($row->playerId === $players[1]->getId()) {
                $p1Score = $row->totalScore;
            }
        }
        self::assertSame(200, $p1Score);
    }

    public function testCountGamesPlayedByPlayer(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();

        $this->completeGame($session, $players[0]);
        $this->completeGame($session, $players[1]);

        $rows = $this->repo->countGamesPlayedByPlayer();
        self::assertNotEmpty($rows);

        // Each player participated in both games
        foreach ($rows as $row) {
            self::assertSame(2, $row->gamesPlayed);
        }
    }

    public function testGetPlayerScoreAggregates(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();
        /** @var Player $player0 */
        $player0 = $players[0];

        // Player 0 takes 2 games
        $this->completeGame($session, $player0, takerScore: 200);
        $this->completeGame($session, $player0, takerScore: -100);
        // Player 1 takes (player 0 is defender)
        $this->completeGame($session, $players[1], takerScore: 300);

        $agg = $this->repo->getPlayerScoreAggregates($player0);

        self::assertSame(3, $agg['gamesPlayed']);
        self::assertIsFloat($agg['averageScore']);
        // Best game = 200 (as taker), worst includes defense scores
        self::assertGreaterThanOrEqual($agg['worstGameScore'], $agg['bestGameScore']);
    }

    public function testGetPlayerBestAndWorstScore(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();
        /** @var Player $player0 */
        $player0 = $players[0];

        self::assertNull($this->repo->getPlayerBestScore($player0));
        self::assertNull($this->repo->getPlayerWorstScore($player0));

        $this->completeGame($session, $player0, takerScore: 500);
        $this->completeGame($session, $player0, takerScore: -200);

        $best = $this->repo->getPlayerBestScore($player0);
        $worst = $this->repo->getPlayerWorstScore($player0);

        self::assertNotNull($best);
        self::assertNotNull($worst);
        self::assertSame(500, $best->score);
        self::assertSame(-200, $worst->score);
    }

    public function testGetPlayerBestSessionTotal(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();
        /** @var Player $player0 */
        $player0 = $players[0];

        self::assertNull($this->repo->getPlayerBestSessionTotal($player0));

        $this->completeGame($session, $player0, takerScore: 200);
        $this->completeGame($session, $player0, takerScore: 300);

        $result = $this->repo->getPlayerBestSessionTotal($player0);
        self::assertNotNull($result);
        self::assertSame(500, $result->total);
        self::assertSame($session->getId(), $result->sessionId);
    }

    public function testCountNightOwlGamesForPlayers(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();

        // Game completed at 2 AM (night owl)
        $nightTime = new \DateTimeImmutable('2026-02-20 02:00:00');
        $this->completeGame($session, $players[0], completedAt: $nightTime);

        // Game completed at 10 AM (not night owl)
        $dayTime = new \DateTimeImmutable('2026-02-20 10:00:00');
        $this->completeGame($session, $players[1], completedAt: $dayTime);

        $playerId = $players[0]->getId();
        $map = $this->repo->countNightOwlGamesForPlayers([$playerId]);

        // Player 0 participated in both games, but only the 2 AM one is night owl
        self::assertSame(1, $map[$playerId]);
    }

    public function testGetEntriesForSessionsByPosition(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();

        $this->completeGame($session, $players[0], takerScore: 200);
        $this->completeGame($session, $players[1], takerScore: 100);

        $sessionId = $session->getId();
        $map = $this->repo->getEntriesForSessionsByPosition([$sessionId]);

        // 2 games × 5 players = 10 entries
        self::assertCount(10, $map[$sessionId]);
    }
}
