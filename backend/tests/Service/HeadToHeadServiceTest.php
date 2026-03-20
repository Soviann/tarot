<?php

declare(strict_types=1);

namespace App\Tests\Service;

use App\Entity\Player;
use App\Repository\GameRepository;
use App\Repository\ScoreEntryRepository;
use App\Repository\SessionRepository;
use App\Service\HeadToHeadService;
use PHPUnit\Framework\MockObject\Stub;
use PHPUnit\Framework\TestCase;

final class HeadToHeadServiceTest extends TestCase
{
    private GameRepository&Stub $gameRepository;
    private ScoreEntryRepository&Stub $scoreEntryRepository;
    private HeadToHeadService $service;
    private SessionRepository&Stub $sessionRepository;

    protected function setUp(): void
    {
        $this->gameRepository = $this->createStub(GameRepository::class);
        $this->scoreEntryRepository = $this->createStub(ScoreEntryRepository::class);
        $this->sessionRepository = $this->createStub(SessionRepository::class);

        $this->service = new HeadToHeadService(
            $this->gameRepository,
            $this->scoreEntryRepository,
            $this->sessionRepository,
        );
    }

    public function testGetHeadToHeadAssemblesData(): void
    {
        $player1 = $this->createPlayerStub(1, 'Alice', '#ff0000');
        $player2 = $this->createPlayerStub(2, 'Bob', '#0000ff');

        $this->sessionRepository->method('countSharedSessions')
            ->willReturn(3);

        $this->gameRepository->method('countSharedCompletedGames')
            ->willReturn(10);

        // Player 1 as taker
        $this->gameRepository->method('countTakerGamesInSharedSessions')
            ->willReturnCallback(static fn (Player $taker): int => 1 === $taker->getId() ? 5 : 4);

        $this->gameRepository->method('countTakerWinsInSharedSessions')
            ->willReturnCallback(static fn (Player $taker): int => 1 === $taker->getId() ? 3 : 2);

        $this->gameRepository->method('countTakerVsDefender')
            ->willReturnCallback(static fn (Player $taker): int => 1 === $taker->getId() ? 2 : 1);

        $this->gameRepository->method('countTakerWinsVsDefender')
            ->willReturnCallback(static fn (Player $taker): int => 1 === $taker->getId() ? 1 : 0);

        $this->gameRepository->method('countCalledAsPartner')
            ->willReturnCallback(static fn (Player $taker): int => 1 === $taker->getId() ? 2 : 1);

        $this->scoreEntryRepository->method('getPlayerScoreInSharedSessions')
            ->willReturnCallback(static fn (Player $p): array => 1 === $p->getId()
                ? ['averageScore' => 25.5, 'totalScore' => 510]
                : ['averageScore' => -12.3, 'totalScore' => -246]);

        $result = $this->service->getHeadToHead($player1, $player2);

        self::assertSame(3, $result['sharedSessions']);
        self::assertSame(10, $result['sharedGames']);

        $p1 = $result['player1'];
        self::assertSame(1, $p1->playerId);
        self::assertSame('Alice', $p1->playerName);
        self::assertSame('#ff0000', $p1->playerColor);
        self::assertSame(5, $p1->gamesAsTaker);
        self::assertSame(3, $p1->winsAsTaker);
        self::assertSame(2, $p1->gamesAsTakerVsOtherAsDefender);
        self::assertSame(1, $p1->winsAsTakerVsOtherAsDefender);
        self::assertSame(2, $p1->calledOtherAsPartner);
        self::assertSame(510, $p1->totalScore);
        self::assertSame(25.5, $p1->averageScore);

        $p2 = $result['player2'];
        self::assertSame(2, $p2->playerId);
        self::assertSame('Bob', $p2->playerName);
        self::assertSame(4, $p2->gamesAsTaker);
        self::assertSame(2, $p2->winsAsTaker);
        self::assertSame(1, $p2->gamesAsTakerVsOtherAsDefender);
        self::assertSame(0, $p2->winsAsTakerVsOtherAsDefender);
        self::assertSame(1, $p2->calledOtherAsPartner);
        self::assertSame(-246, $p2->totalScore);
        self::assertSame(-12.3, $p2->averageScore);
    }

    private function createPlayerStub(int $id, string $name, ?string $color = null): Player&Stub
    {
        $player = $this->createStub(Player::class);
        $player->method('getId')->willReturn($id);
        $player->method('getName')->willReturn($name);
        $player->method('getColor')->willReturn($color);

        return $player;
    }
}
