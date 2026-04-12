<?php

declare(strict_types=1);

namespace App\Tests\Repository;

use App\Entity\Game;
use App\Entity\Player;
use App\Entity\Session;
use App\Enum\Contract;
use App\Enum\GameStatus;
use App\Repository\GameRepository;
use App\Tests\Api\ApiTestCase;

class GameRepositoryTest extends ApiTestCase
{
    private GameRepository $repo;

    protected function setUp(): void
    {
        parent::setUp();

        /** @var GameRepository $repo */
        $repo = $this->em->getRepository(Game::class);
        $this->repo = $repo;
    }

    public function testCountBySessionAndStatus(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();

        $this->completeGame($session, $players[0]);
        $this->createInProgressGame($session, $players[1]);

        self::assertSame(1, $this->repo->countBySessionAndStatus($session, GameStatus::Completed));
        self::assertSame(1, $this->repo->countBySessionAndStatus($session, GameStatus::InProgress));
    }

    public function testCountCompletedForSession(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();

        self::assertSame(0, $this->repo->countCompletedForSession($session));

        $this->completeGame($session, $players[0]);
        $this->completeGame($session, $players[1]);

        self::assertSame(2, $this->repo->countCompletedForSession($session));
    }

    public function testCountPartnerAppearancesPerPlayerForSession(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();

        $this->completeGame($session, $players[0], partner: $players[1]);
        $this->completeGame($session, $players[2], partner: $players[1]);
        $this->completeGame($session, $players[3], partner: $players[4]);

        $counts = $this->repo->countPartnerAppearancesPerPlayerForSession($session);

        self::assertSame(2, $counts[$players[1]->getId()]);
        self::assertSame(1, $counts[$players[4]->getId()]);
    }

    public function testCountTakerWinsPerPlayerForSession(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();

        // Player 0 wins (positive taker score)
        $this->completeGame($session, $players[0], takerScore: 200);
        // Player 0 loses (negative taker score)
        $this->completeGame($session, $players[0], takerScore: -100);
        // Player 1 wins
        $this->completeGame($session, $players[1], takerScore: 150);

        $wins = $this->repo->countTakerWinsPerPlayerForSession($session);

        self::assertSame(1, $wins[$players[0]->getId()]);
        self::assertSame(1, $wins[$players[1]->getId()]);
    }

    public function testCountTakerGamesPerPlayerForSession(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();

        $this->completeGame($session, $players[0]);
        $this->completeGame($session, $players[0]);
        $this->completeGame($session, $players[1]);

        $counts = $this->repo->countTakerGamesPerPlayerForSession($session);

        self::assertSame(2, $counts[$players[0]->getId()]);
        self::assertSame(1, $counts[$players[1]->getId()]);
    }

    public function testFindInProgressForSession(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();

        self::assertNull($this->repo->findInProgressForSession($session));

        $game = $this->createInProgressGame($session, $players[0]);

        self::assertSame($game->getId(), $this->repo->findInProgressForSession($session)?->getId());
    }

    public function testGetMaxPositionForSession(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();

        self::assertSame(0, $this->repo->getMaxPositionForSession($session));

        $this->completeGame($session, $players[0]);
        self::assertSame(1, $this->repo->getMaxPositionForSession($session));

        $this->completeGame($session, $players[1]);
        self::assertSame(2, $this->repo->getMaxPositionForSession($session));
    }

    public function testFindMostPlayedContractForSession(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();

        self::assertNull($this->repo->findMostPlayedContractForSession($session));

        $this->completeGame($session, $players[0], Contract::Garde);
        $this->completeGame($session, $players[1], Contract::Garde);
        $this->completeGame($session, $players[2], Contract::Petite);

        $result = $this->repo->findMostPlayedContractForSession($session);
        self::assertNotNull($result);
        self::assertSame(Contract::Garde, $result->contract);
        self::assertSame(2, $result->count);
    }

    public function testGetContractDistribution(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();

        $this->completeGame($session, $players[0], Contract::Garde);
        $this->completeGame($session, $players[1], Contract::Petite);
        $this->completeGame($session, $players[2], Contract::Garde);

        $rows = $this->repo->getContractDistribution();
        self::assertNotEmpty($rows);

        $gardeRow = null;
        foreach ($rows as $row) {
            if (Contract::Garde === $row->contract) {
                $gardeRow = $row;
                break;
            }
        }
        self::assertNotNull($gardeRow);
        self::assertSame(2, $gardeRow->count);
    }

    public function testGetContractDistributionWithDateRange(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();

        $past = new \DateTimeImmutable('2025-01-01');
        $recent = new \DateTimeImmutable('2026-02-20');

        $this->completeGame($session, $players[0], Contract::Garde, completedAt: $past);
        $this->completeGame($session, $players[1], Contract::Petite, completedAt: $recent);

        $dateRange = new \App\Dto\DateRange(new \DateTimeImmutable('2026-01-01'));

        $rows = $this->repo->getContractDistribution($dateRange);
        self::assertCount(1, $rows);
        self::assertSame(Contract::Petite, $rows[0]->contract);
    }

    public function testCountCompleted(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();

        self::assertSame(0, $this->repo->countCompleted());

        $this->completeGame($session, $players[0]);
        $this->createInProgressGame($session, $players[1]);

        self::assertSame(1, $this->repo->countCompleted());
    }

    public function testGetContractCountByPlayer(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();

        $this->completeGame($session, $players[0], Contract::Garde);
        $this->completeGame($session, $players[0], Contract::Petite);
        $this->completeGame($session, $players[1], Contract::Garde);

        $rows = $this->repo->getContractCountByPlayer();
        self::assertNotEmpty($rows);

        $player0Garde = null;
        foreach ($rows as $row) {
            if ($row->playerId === $players[0]->getId() && Contract::Garde === $row->contract) {
                $player0Garde = $row;
                break;
            }
        }
        self::assertNotNull($player0Garde);
        self::assertSame(1, $player0Garde->count);
    }

    public function testGetContractWinsByPlayer(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();

        $this->completeGame($session, $players[0], Contract::Garde, takerScore: 200);
        $this->completeGame($session, $players[0], Contract::Garde, takerScore: -100);

        $rows = $this->repo->getContractWinsByPlayer();

        $found = false;
        foreach ($rows as $row) {
            if ($row->playerId === $players[0]->getId()) {
                self::assertSame(1, $row->wins);
                $found = true;
            }
        }
        self::assertTrue($found);
    }

    public function testCountTakerGames(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();

        $this->completeGame($session, $players[0]);
        $this->completeGame($session, $players[0]);
        $this->completeGame($session, $players[1]);

        $rows = $this->repo->countTakerGames();
        self::assertNotEmpty($rows);

        $p0Count = null;
        foreach ($rows as $row) {
            if ($row->playerId === $players[0]->getId()) {
                $p0Count = $row->count;
            }
        }
        self::assertSame(2, $p0Count);
    }

    public function testCountTakerWins(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();

        $this->completeGame($session, $players[0], takerScore: 200);
        $this->completeGame($session, $players[0], takerScore: -100);
        $this->completeGame($session, $players[1], takerScore: 150);

        $rows = $this->repo->countTakerWins();

        $p0Wins = null;
        foreach ($rows as $row) {
            if ($row->playerId === $players[0]->getId()) {
                $p0Wins = $row->count;
            }
        }
        self::assertSame(1, $p0Wins);
    }

    public function testGetHighContractTakerCountsForSession(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();

        $this->completeGame($session, $players[0], Contract::GardeSans);
        $this->completeGame($session, $players[0], Contract::GardeContre);
        $this->completeGame($session, $players[1], Contract::GardeSans);

        $result = $this->repo->getHighContractTakerCountsForSession(
            $session,
            [Contract::GardeSans, Contract::GardeContre]
        );

        self::assertNotNull($result);
        self::assertSame($players[0]->getId(), $result->playerId);
        self::assertSame(2, $result->count);
    }

    public function testGetTakerGameDetailsForPlayers(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();
        $playerId = $players[0]->getId();

        $this->completeGame($session, $players[0], Contract::Garde, takerScore: 200);
        $this->completeGame($session, $players[0], Contract::Petite, takerScore: -50);

        $map = $this->repo->getTakerGameDetailsForPlayers([$playerId]);
        self::assertCount(2, $map[$playerId]);
        self::assertSame('garde', $map[$playerId][0]->contract);
    }

    public function testGetMarathonSessionsForPlayers(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();

        // Create a game completed 2 hours after session creation
        $completedAt = (new \DateTimeImmutable())->modify('+2 hours');
        $this->completeGame($session, $players[0], completedAt: $completedAt);

        $playerId = $players[0]->getId();
        // Threshold 1 hour = 3600 seconds → this session qualifies
        $map = $this->repo->getMarathonSessionsForPlayers([$playerId], 3600);
        self::assertNotEmpty($map[$playerId]);

        // Threshold 3 hours = 10800 seconds → this session does NOT qualify
        $map = $this->repo->getMarathonSessionsForPlayers([$playerId], 10800);
        self::assertEmpty($map[$playerId]);
    }

    public function testGetAverageDurationSeconds(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();

        self::assertNull($this->repo->getAverageDurationSeconds());

        $completedAt = (new \DateTimeImmutable())->modify('+60 seconds');
        $this->completeGame($session, $players[0], completedAt: $completedAt);

        $avg = $this->repo->getAverageDurationSeconds();
        self::assertNotNull($avg);
        self::assertGreaterThan(0, $avg);
    }

    public function testGetTotalDurationSeconds(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();

        self::assertSame(0, $this->repo->getTotalDurationSeconds());

        $completedAt = (new \DateTimeImmutable())->modify('+120 seconds');
        $this->completeGame($session, $players[0], completedAt: $completedAt);

        self::assertGreaterThan(0, $this->repo->getTotalDurationSeconds());
    }

    public function testGetContractDistributionForSession(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();

        self::assertSame([], $this->repo->getContractDistributionForSession($session));

        $this->completeGame($session, $players[0], Contract::Garde);
        $this->completeGame($session, $players[1], Contract::Garde);
        $this->completeGame($session, $players[2], Contract::Petite);

        $rows = $this->repo->getContractDistributionForSession($session);
        self::assertCount(2, $rows);
        self::assertSame(Contract::Garde, $rows[0]->contract);
        self::assertSame(2, $rows[0]->count);
        self::assertSame(Contract::Petite, $rows[1]->contract);
        self::assertSame(1, $rows[1]->count);
    }

    public function testGetContractDistributionForSessionExcludesOtherSessions(): void
    {
        $session1 = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $session2 = $this->createSessionWithPlayers('F', 'G', 'H', 'I', 'J');
        $this->completeGame($session1, $session1->getPlayers()->first(), Contract::Garde);
        $this->completeGame($session2, $session2->getPlayers()->first(), Contract::Petite);

        $rows = $this->repo->getContractDistributionForSession($session1);
        self::assertCount(1, $rows);
        self::assertSame(Contract::Garde, $rows[0]->contract);
    }

    public function testGetContractCountByPlayerForSession(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();

        $this->completeGame($session, $players[0], Contract::Garde);
        $this->completeGame($session, $players[0], Contract::Petite);
        $this->completeGame($session, $players[1], Contract::Garde);

        $rows = $this->repo->getContractCountByPlayerForSession($session);
        self::assertNotEmpty($rows);

        $player0Garde = null;
        foreach ($rows as $row) {
            if ($row->playerId === $players[0]->getId() && Contract::Garde === $row->contract) {
                $player0Garde = $row;
                break;
            }
        }
        self::assertNotNull($player0Garde);
        self::assertSame(1, $player0Garde->count);
    }

    public function testGetContractWinsByPlayerForSession(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();

        $this->completeGame($session, $players[0], Contract::Garde, takerScore: 200);
        $this->completeGame($session, $players[0], Contract::Garde, takerScore: -100);

        $rows = $this->repo->getContractWinsByPlayerForSession($session);

        $found = false;
        foreach ($rows as $row) {
            if ($row->playerId === $players[0]->getId()) {
                self::assertSame(1, $row->wins);
                $found = true;
            }
        }
        self::assertTrue($found);
    }

    private function createInProgressGame(Session $session, Player $taker): Game
    {
        $game = new Game();
        $game->setContract(Contract::Petite);
        $game->setPosition($session->getGames()->count() + 1);
        $game->setSession($session);
        $game->setStatus(GameStatus::InProgress);
        $game->setTaker($taker);

        $this->em->persist($game);
        $session->addGame($game);
        $this->em->flush();

        return $game;
    }
}
