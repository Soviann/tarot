<?php

declare(strict_types=1);

namespace App\Tests\Unit\State;

use ApiPlatform\Doctrine\Common\State\RemoveProcessor;
use ApiPlatform\Metadata\Operation;
use App\Entity\Game;
use App\Entity\Session;
use App\State\EloRevertHelper;
use App\State\GameDeleteProcessor;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class GameDeleteProcessorTest extends TestCase
{
    private EntityManagerInterface&MockObject $em;
    private EloRevertHelper&MockObject $eloRevertHelper;
    private GameDeleteProcessor $processor;
    private RemoveProcessor&MockObject $removeProcessor;

    protected function setUp(): void
    {
        $this->em = $this->createMock(EntityManagerInterface::class);
        $this->eloRevertHelper = $this->createMock(EloRevertHelper::class);
        $this->removeProcessor = $this->createMock(RemoveProcessor::class);

        $this->processor = new GameDeleteProcessor(
            $this->em,
            $this->eloRevertHelper,
            $this->removeProcessor,
        );
    }

    public function testProcessRevertsEloThenRemoves(): void
    {
        $session = new Session();
        $game = new Game();
        $game->setSession($session);
        $operation = $this->createStub(Operation::class);

        $callOrder = [];

        $this->eloRevertHelper->expects($this->once())
            ->method('revert')
            ->with($game)
            ->willReturnCallback(static function () use (&$callOrder): void {
                $callOrder[] = 'revert';
            });

        $this->em->expects($this->once())
            ->method('flush')
            ->willReturnCallback(static function () use (&$callOrder): void {
                $callOrder[] = 'flush';
            });

        $this->removeProcessor->expects($this->once())
            ->method('process')
            ->with($game, $operation, [], [])
            ->willReturnCallback(static function () use (&$callOrder): void {
                $callOrder[] = 'remove';
            });

        $this->processor->process($game, $operation);

        $this->assertSame(['revert', 'flush', 'remove'], $callOrder);
    }

    public function testProcessPassesAllArguments(): void
    {
        $session = new Session();
        $game = new Game();
        $game->setSession($session);
        $operation = $this->createStub(Operation::class);
        $uriVariables = ['sessionId' => 42];
        $context = ['groups' => ['game:delete']];

        $this->eloRevertHelper->expects($this->once())
            ->method('revert')
            ->with($game);

        $this->em->expects($this->once())
            ->method('flush');

        $this->removeProcessor->expects($this->once())
            ->method('process')
            ->with($game, $operation, $uriVariables, $context);

        $this->processor->process($game, $operation, $uriVariables, $context);
    }
}
