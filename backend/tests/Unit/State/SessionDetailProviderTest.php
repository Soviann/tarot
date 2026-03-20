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
use PHPUnit\Framework\MockObject\Stub;
use PHPUnit\Framework\TestCase;

class SessionDetailProviderTest extends TestCase
{
    private GameRepository&Stub $gameRepository;
    private ItemProvider&Stub $itemProvider;
    private Operation&Stub $operation;
    private SessionDetailProvider $provider;
    private ScoreEntryRepository&Stub $scoreEntryRepository;

    protected function setUp(): void
    {
        $this->gameRepository = $this->createStub(GameRepository::class);
        $this->itemProvider = $this->createStub(ItemProvider::class);
        $this->operation = $this->createStub(Operation::class);
        $this->scoreEntryRepository = $this->createStub(ScoreEntryRepository::class);

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
            ->willReturn($lastPlayed);
        $this->scoreEntryRepository->method('getCumulativeScoresForSession')
            ->willReturn($dtos);
        $this->gameRepository->method('findInProgressForSession')
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
            ->willReturn(null);
        $this->scoreEntryRepository->method('getCumulativeScoresForSession')->willReturn([]);
        $this->gameRepository->method('findInProgressForSession')->willReturn(null);

        $result = $this->provider->provide($this->operation, ['id' => 1]);

        $this->assertSame($session->getCreatedAt(), $result->getLastPlayedAt());
        $this->assertNull($result->getInProgressGame());
        $this->assertSame([], $result->getCumulativeScores());
    }
}
