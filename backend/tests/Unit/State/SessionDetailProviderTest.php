<?php

declare(strict_types=1);

namespace App\Tests\Unit\State;

use ApiPlatform\Doctrine\Orm\State\ItemProvider;
use ApiPlatform\Metadata\Operation;
use App\Dto\CumulativeScoreDto;
use App\Entity\Game;
use App\Entity\Session;
use App\Repository\GameRepository;
use App\Repository\ScoreEntryRepository;
use App\State\SessionDetailProvider;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class SessionDetailProviderTest extends TestCase
{
    private GameRepository&MockObject $gameRepository;
    private ItemProvider&MockObject $itemProvider;
    private Operation&MockObject $operation;
    private SessionDetailProvider $provider;
    private ScoreEntryRepository&MockObject $scoreEntryRepository;

    protected function setUp(): void
    {
        $this->gameRepository = $this->createMock(GameRepository::class);
        $this->itemProvider = $this->createMock(ItemProvider::class);
        $this->operation = $this->createMock(Operation::class);
        $this->scoreEntryRepository = $this->createMock(ScoreEntryRepository::class);

        $this->provider = new SessionDetailProvider(
            $this->gameRepository,
            $this->itemProvider,
            $this->scoreEntryRepository,
        );
    }

    public function testReturnsNullWhenSessionNotFound(): void
    {
        $this->itemProvider->method('provide')->willReturn(null);

        $result = $this->provider->provide($this->operation, ['id' => 99]);

        $this->assertNull($result);
    }

    public function testEnrichesWithScoresLastPlayedAtAndInProgressGame(): void
    {
        $session = new Session();
        $lastPlayed = new \DateTimeImmutable('2026-02-20');
        $inProgressGame = new Game();
        $dtos = [
            new CumulativeScoreDto(1, 'Alice', 500),
            new CumulativeScoreDto(2, 'Bob', -200),
        ];

        $this->itemProvider->method('provide')->willReturn($session);
        $this->gameRepository->method('getMaxCreatedAtForSession')
            ->with($session)
            ->willReturn($lastPlayed);
        $this->scoreEntryRepository->method('getCumulativeScoresForSession')
            ->with($session)
            ->willReturn($dtos);
        $this->gameRepository->method('findInProgressForSession')
            ->with($session)
            ->willReturn($inProgressGame);

        $result = $this->provider->provide($this->operation, ['id' => 1]);

        $this->assertSame($session, $result);
        $this->assertSame($lastPlayed, $result->getLastPlayedAt());
        $this->assertSame($inProgressGame, $result->getInProgressGame());
        $this->assertSame([
            ['playerId' => 1, 'playerName' => 'Alice', 'score' => 500],
            ['playerId' => 2, 'playerName' => 'Bob', 'score' => -200],
        ], $result->getCumulativeScores());
    }

    public function testFallbackToCreatedAtWhenNoGames(): void
    {
        $session = new Session();

        $this->itemProvider->method('provide')->willReturn($session);
        $this->gameRepository->method('getMaxCreatedAtForSession')
            ->with($session)
            ->willReturn(null);
        $this->scoreEntryRepository->method('getCumulativeScoresForSession')->willReturn([]);
        $this->gameRepository->method('findInProgressForSession')->willReturn(null);

        $result = $this->provider->provide($this->operation, ['id' => 1]);

        $this->assertSame($session->getCreatedAt(), $result->getLastPlayedAt());
        $this->assertNull($result->getInProgressGame());
        $this->assertSame([], $result->getCumulativeScores());
    }
}
