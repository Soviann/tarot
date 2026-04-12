<?php

declare(strict_types=1);

namespace App\Tests\Repository;

use App\Entity\StarEvent;
use App\Repository\StarEventRepository;
use App\Tests\Api\ApiTestCase;

class StarEventRepositoryTest extends ApiTestCase
{
    private StarEventRepository $repo;

    protected function setUp(): void
    {
        parent::setUp();

        /** @var StarEventRepository $repo */
        $repo = $this->em->getRepository(StarEvent::class);
        $this->repo = $repo;
    }

    public function testGetStarRankingReturnsPlayersOrderedByStarCount(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Dave', 'Eve');
        $players = $session->getPlayers()->toArray();

        // Alice: 3 stars, Bob: 1 star, Charlie: 2 stars
        $this->createStarEvent($session, $players[0]);
        $this->createStarEvent($session, $players[0]);
        $this->createStarEvent($session, $players[0]);
        $this->createStarEvent($session, $players[1]);
        $this->createStarEvent($session, $players[2]);
        $this->createStarEvent($session, $players[2]);

        $result = $this->repo->getStarRanking();

        self::assertCount(3, $result);
        self::assertSame('Alice', $result[0]->playerName);
        self::assertSame(3, $result[0]->count);
        self::assertSame('Charlie', $result[1]->playerName);
        self::assertSame(2, $result[1]->count);
        self::assertSame('Bob', $result[2]->playerName);
        self::assertSame(1, $result[2]->count);
    }

    public function testGetStarRankingReturnsEmptyWhenNoStars(): void
    {
        $result = $this->repo->getStarRanking();

        self::assertSame([], $result);
    }

    public function testGetStarRankingFiltersOnPlayerGroup(): void
    {
        $session1 = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Dave', 'Eve');
        $players1 = $session1->getPlayers()->toArray();
        $group = $this->createPlayerGroup('Group', $players1[0], $players1[1]);
        $session1->setPlayerGroup($group);
        $this->em->flush();

        $session2 = $this->createSessionWithPlayers('Xander', 'Yuri', 'Zara', 'Wendy', 'Vera');
        $players2 = $session2->getPlayers()->toArray();

        // Alice: 2 stars in group session
        $this->createStarEvent($session1, $players1[0]);
        $this->createStarEvent($session1, $players1[0]);
        // Xander: 3 stars in non-group session
        $this->createStarEvent($session2, $players2[0]);
        $this->createStarEvent($session2, $players2[0]);
        $this->createStarEvent($session2, $players2[0]);

        $result = $this->repo->getStarRanking(playerGroupId: $group->getId());

        self::assertCount(1, $result);
        self::assertSame('Alice', $result[0]->playerName);
        self::assertSame(2, $result[0]->count);
    }
}
