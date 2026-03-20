<?php

declare(strict_types=1);

namespace App\Tests\Unit\State;

use ApiPlatform\Doctrine\Common\State\PersistProcessor;
use ApiPlatform\Metadata\Operation;
use App\Entity\Game;
use App\Entity\Player;
use App\Entity\Session;
use App\Enum\Contract;
use App\Enum\GameStatus;
use App\Repository\GameRepository;
use App\Repository\SessionRepository;
use App\State\GameCreateProcessor;
use PHPUnit\Framework\MockObject\Stub;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class GameCreateProcessorTest extends TestCase
{
    private GameRepository&Stub $gameRepository;
    private Operation&Stub $operation;
    private PersistProcessor&Stub $persistProcessor;
    private GameCreateProcessor $processor;
    private SessionRepository&Stub $sessionRepository;

    protected function setUp(): void
    {
        $this->gameRepository = $this->createStub(GameRepository::class);
        $this->persistProcessor = $this->createStub(PersistProcessor::class);
        $this->sessionRepository = $this->createStub(SessionRepository::class);

        $this->processor = new GameCreateProcessor(
            $this->gameRepository,
            $this->persistProcessor,
            $this->sessionRepository,
        );

        $this->operation = $this->createStub(Operation::class);
    }

    public function testProcessSetsPositionStatusDealerAndSession(): void
    {
        $taker = new Player();
        $taker->setName('Alice');
        $this->setId($taker, 1);

        $dealer = new Player();
        $dealer->setName('Bob');
        $this->setId($dealer, 2);

        $session = new Session();
        $this->setId($session, 10);
        $session->setIsActive(true);
        $session->setCurrentDealer($dealer);
        $session->addPlayer($taker);
        $session->addPlayer($dealer);

        $game = new Game();
        $game->setContract(Contract::Petite);
        $game->setTaker($taker);

        $this->sessionRepository->method('find')
            ->willReturn($session);

        $this->gameRepository->method('countBySessionAndStatus')
            ->willReturn(0);

        $this->gameRepository->method('getMaxPositionForSession')
            ->willReturn(3);

        $persistProcessor = $this->createMock(PersistProcessor::class);
        $persistProcessor->expects($this->once())
            ->method('process')
            ->with($game, $this->operation, ['sessionId' => 10], [])
            ->willReturn($game);

        $processor = new GameCreateProcessor(
            $this->gameRepository,
            $persistProcessor,
            $this->sessionRepository,
        );

        $result = $processor->process($game, $this->operation, ['sessionId' => 10]);

        $this->assertSame($game, $result);
        $this->assertSame(4, $game->getPosition());
        $this->assertSame(GameStatus::InProgress, $game->getStatus());
        $this->assertSame($dealer, $game->getDealer());
        $this->assertSame($session, $game->getSession());
    }

    public function testProcessThrowsOnSessionNotFound(): void
    {
        $this->sessionRepository->method('find')
            ->willReturn(null);

        $game = new Game();
        $game->setContract(Contract::Petite);

        $this->expectException(UnprocessableEntityHttpException::class);
        $this->expectExceptionMessage('Session introuvable.');

        $this->processor->process($game, $this->operation, ['sessionId' => 999]);
    }

    public function testProcessThrowsOnClosedSession(): void
    {
        $session = new Session();
        $this->setId($session, 10);
        $session->setIsActive(false);

        $this->sessionRepository->method('find')
            ->willReturn($session);

        $game = new Game();
        $game->setContract(Contract::Petite);

        $this->expectException(UnprocessableEntityHttpException::class);
        $this->expectExceptionMessage('La session est clôturée');

        $this->processor->process($game, $this->operation, ['sessionId' => 10]);
    }

    public function testProcessThrowsOnGameInProgress(): void
    {
        $taker = new Player();
        $taker->setName('Alice');
        $this->setId($taker, 1);

        $session = new Session();
        $this->setId($session, 10);
        $session->setIsActive(true);

        $this->sessionRepository->method('find')
            ->willReturn($session);

        $this->gameRepository->method('countBySessionAndStatus')
            ->willReturn(1);

        $game = new Game();
        $game->setContract(Contract::Petite);
        $game->setTaker($taker);

        $this->expectException(UnprocessableEntityHttpException::class);
        $this->expectExceptionMessage('Une donne est déjà en cours');

        $this->processor->process($game, $this->operation, ['sessionId' => 10]);
    }

    public function testProcessThrowsOnTakerNotInSession(): void
    {
        $taker = new Player();
        $taker->setName('Charlie');
        $this->setId($taker, 3);

        $otherPlayer = new Player();
        $otherPlayer->setName('Alice');
        $this->setId($otherPlayer, 1);

        $session = new Session();
        $this->setId($session, 10);
        $session->setIsActive(true);
        $session->addPlayer($otherPlayer);

        $this->sessionRepository->method('find')
            ->willReturn($session);

        $this->gameRepository->method('countBySessionAndStatus')
            ->willReturn(0);

        $game = new Game();
        $game->setContract(Contract::Petite);
        $game->setTaker($taker);

        $this->expectException(UnprocessableEntityHttpException::class);
        $this->expectExceptionMessage('Le joueur "Charlie" n\'appartient pas à la session.');

        $this->processor->process($game, $this->operation, ['sessionId' => 10]);
    }

    public function testProcessAutoIncrementsPosition(): void
    {
        $taker = new Player();
        $taker->setName('Alice');
        $this->setId($taker, 1);

        $session = new Session();
        $this->setId($session, 10);
        $session->setIsActive(true);
        $session->addPlayer($taker);

        $this->sessionRepository->method('find')
            ->willReturn($session);

        $this->gameRepository->method('countBySessionAndStatus')
            ->willReturn(0);

        $this->gameRepository->method('getMaxPositionForSession')
            ->willReturn(5);

        $this->persistProcessor->method('process')->willReturnArgument(0);

        $game = new Game();
        $game->setContract(Contract::Petite);
        $game->setTaker($taker);

        $result = $this->processor->process($game, $this->operation, ['sessionId' => 10]);

        $this->assertSame(6, $result->getPosition());
    }

    private function setId(object $entity, int $id): void
    {
        $ref = new \ReflectionProperty($entity, 'id');
        $ref->setValue($entity, $id);
    }
}
