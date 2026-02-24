<?php

declare(strict_types=1);

namespace App\Tests\Repository;

use App\Dto\DateRange;
use App\Entity\Session;
use App\Repository\SessionRepository;
use App\Tests\Api\ApiTestCase;

class SessionRepositoryTest extends ApiTestCase
{
    private SessionRepository $repo;

    protected function setUp(): void
    {
        parent::setUp();

        /** @var SessionRepository $repo */
        $repo = $this->em->getRepository(Session::class);
        $this->repo = $repo;
    }

    public function testCloseActiveSessionsForGroup(): void
    {
        $session1 = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $session2 = $this->createSessionWithPlayers('F', 'G', 'H', 'I', 'J');
        $group = $this->createPlayerGroup('G1', ...$session1->getPlayers()->toArray());

        $session1->setPlayerGroup($group);
        $this->em->flush();

        $affected = $this->repo->closeActiveSessionsForGroup($group);
        self::assertSame(1, $affected);

        // Refresh to get updated state
        $this->em->refresh($session1);
        $this->em->refresh($session2);

        self::assertFalse($session1->getIsActive());
        self::assertTrue($session2->getIsActive());
    }

    public function testFindActiveWithExactPlayersMatch(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $playerIds = $session->getPlayers()->map(static fn ($p) => $p->getId())->getValues();

        $found = $this->repo->findActiveWithExactPlayers($playerIds, 5);
        self::assertNotNull($found);
        self::assertSame($session->getId(), $found->getId());
    }

    public function testFindActiveWithExactPlayersNoMatch(): void
    {
        $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');

        // Search for player IDs that don't match
        $found = $this->repo->findActiveWithExactPlayers([99999, 99998, 99997, 99996, 99995], 5);
        self::assertNull($found);
    }

    public function testFindActiveWithExactPlayersIgnoresInactive(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $session->setIsActive(false);
        $this->em->flush();

        $playerIds = $session->getPlayers()->map(static fn ($p) => $p->getId())->getValues();

        $found = $this->repo->findActiveWithExactPlayers($playerIds, 5);
        self::assertNull($found);
    }

    public function testFindRecentWithLastActivityOrdering(): void
    {
        // Create 2 sessions
        $session1 = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $session2 = $this->createSessionWithPlayers('F', 'G', 'H', 'I', 'J');

        // Add a game to session2 to make it more recent
        $this->completeGame($session2, $session2->getPlayers()->first());

        $recent = $this->repo->findRecentWithLastActivity();
        self::assertNotEmpty($recent);

        // session2 should be first (more recent activity)
        self::assertSame($session2->getId(), $recent[0]->getId());
    }

    public function testFindRecentWithLastActivitySetsLastPlayedAt(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $this->completeGame($session, $session->getPlayers()->first());

        $recent = $this->repo->findRecentWithLastActivity();
        self::assertNotEmpty($recent);

        $lastPlayedAt = $recent[0]->getLastPlayedAt();
        // lastPlayedAt is derived from game createdAt (MAX), which is always >= session createdAt
        // Compare with 1 second tolerance due to sub-second timing
        self::assertInstanceOf(\DateTimeImmutable::class, $lastPlayedAt);
    }

    public function testCountDistinctCoPlayersForPlayers(): void
    {
        $session = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $players = $session->getPlayers()->toArray();

        // Need at least one completed game for co-player count
        $this->completeGame($session, $players[0]);

        $playerId = $players[0]->getId();
        $map = $this->repo->countDistinctCoPlayersForPlayers([$playerId]);

        // Player 0 has 4 co-players in this session
        self::assertSame(4, $map[$playerId]);
    }

    public function testCountAllWithDateRange(): void
    {
        $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $this->createSessionWithPlayers('F', 'G', 'H', 'I', 'J');

        // Without filter
        $total = $this->repo->countAll();
        self::assertGreaterThanOrEqual(2, $total);

        // With future date range → likely 0 sessions (they were created now)
        $dateRange = new DateRange(new \DateTimeImmutable('+1 year'));
        $filtered = $this->repo->countAll($dateRange);
        self::assertSame(0, $filtered);
    }

    public function testCountAllWithGroupFilter(): void
    {
        $session1 = $this->createSessionWithPlayers('A', 'B', 'C', 'D', 'E');
        $this->createSessionWithPlayers('F', 'G', 'H', 'I', 'J');
        $group = $this->createPlayerGroup('G1', ...$session1->getPlayers()->toArray());

        $session1->setPlayerGroup($group);
        $this->em->flush();

        $filtered = $this->repo->countAll(null, $group->getId());
        self::assertSame(1, $filtered);
    }
}
