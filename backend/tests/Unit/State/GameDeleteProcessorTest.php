<?php

declare(strict_types=1);

namespace App\Tests\Unit\State;

use ApiPlatform\Doctrine\Common\State\RemoveProcessor;
use ApiPlatform\Metadata\Operation;
use App\Entity\Game;
use App\State\EloRevertHelper;
use App\State\GameDeleteProcessor;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class GameDeleteProcessorTest extends TestCase
{
    private EloRevertHelper&MockObject $eloRevertHelper;
    private GameDeleteProcessor $processor;
    private RemoveProcessor&MockObject $removeProcessor;

    protected function setUp(): void
    {
        $this->eloRevertHelper = $this->createMock(EloRevertHelper::class);
        $this->removeProcessor = $this->createMock(RemoveProcessor::class);

        $this->processor = new GameDeleteProcessor(
            $this->eloRevertHelper,
            $this->removeProcessor,
        );
    }

    public function testProcessRevertsEloThenRemoves(): void
    {
        $game = new Game();
        $operation = $this->createMock(Operation::class);

        $callOrder = [];

        $this->eloRevertHelper->expects($this->once())
            ->method('revert')
            ->with($game)
            ->willReturnCallback(static function () use (&$callOrder): void {
                $callOrder[] = 'revert';
            });

        $this->removeProcessor->expects($this->once())
            ->method('process')
            ->with($game, $operation, [], [])
            ->willReturnCallback(static function () use (&$callOrder): void {
                $callOrder[] = 'remove';
            });

        $this->processor->process($game, $operation);

        $this->assertSame(['revert', 'remove'], $callOrder);
    }

    public function testProcessPassesAllArguments(): void
    {
        $game = new Game();
        $operation = $this->createMock(Operation::class);
        $uriVariables = ['sessionId' => 42];
        $context = ['groups' => ['game:delete']];

        $this->eloRevertHelper->expects($this->once())
            ->method('revert')
            ->with($game);

        $this->removeProcessor->expects($this->once())
            ->method('process')
            ->with($game, $operation, $uriVariables, $context);

        $this->processor->process($game, $operation, $uriVariables, $context);
    }
}
