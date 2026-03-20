<?php

declare(strict_types=1);

namespace App\Tests\Unit\State;

use App\Entity\EloHistory;
use App\Entity\Game;
use App\Entity\Player;
use App\Repository\EloHistoryRepository;
use App\State\EloRevertHelper;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\MockObject\Stub;
use PHPUnit\Framework\TestCase;

class EloRevertHelperTest extends TestCase
{
    private EloHistoryRepository&Stub $eloHistoryRepository;
    private EntityManagerInterface&MockObject $em;
    private EloRevertHelper $helper;

    protected function setUp(): void
    {
        $this->eloHistoryRepository = $this->createStub(EloHistoryRepository::class);
        $this->em = $this->createMock(EntityManagerInterface::class);

        $this->helper = new EloRevertHelper(
            $this->eloHistoryRepository,
            $this->em,
        );
    }

    public function testRevertRestoresRatingsAndRemovesHistory(): void
    {
        $game = new Game();

        $playerA = new Player();
        $playerA->setName('Alice');
        $playerA->setEloRating(1600);

        $playerB = new Player();
        $playerB->setName('Bob');
        $playerB->setEloRating(1400);

        $historyA = new EloHistory();
        $historyA->setPlayer($playerA);
        $historyA->setRatingBefore(1500);
        $historyA->setRatingAfter(1600);
        $historyA->setRatingChange(100);
        $historyA->setGame($game);

        $historyB = new EloHistory();
        $historyB->setPlayer($playerB);
        $historyB->setRatingBefore(1450);
        $historyB->setRatingAfter(1400);
        $historyB->setRatingChange(-50);
        $historyB->setGame($game);

        $this->eloHistoryRepository->method('findByGame')
            ->willReturn([$historyA, $historyB]);

        $this->em->expects($this->exactly(2))
            ->method('remove')
            ->willReturnCallback(function (object $entity) use ($historyA, $historyB): void {
                static $call = 0;
                if (0 === $call++) {
                    $this->assertSame($historyA, $entity);
                } else {
                    $this->assertSame($historyB, $entity);
                }
            });

        $this->helper->revert($game);

        $this->assertSame(1500, $playerA->getEloRating());
        $this->assertSame(1450, $playerB->getEloRating());
    }

    public function testRevertNoOpOnEmptyHistory(): void
    {
        $game = new Game();

        $this->eloHistoryRepository->method('findByGame')
            ->willReturn([]);

        $this->em->expects($this->never())->method('remove');

        $this->helper->revert($game);
    }

    public function testRevertHandlesSingleHistory(): void
    {
        $game = new Game();

        $player = new Player();
        $player->setName('Charlie');
        $player->setEloRating(1550);

        $history = new EloHistory();
        $history->setPlayer($player);
        $history->setRatingBefore(1500);
        $history->setRatingAfter(1550);
        $history->setRatingChange(50);
        $history->setGame($game);

        $this->eloHistoryRepository->method('findByGame')
            ->willReturn([$history]);

        $this->em->expects($this->once())
            ->method('remove')
            ->with($history);

        $this->helper->revert($game);

        $this->assertSame(1500, $player->getEloRating());
    }
}
