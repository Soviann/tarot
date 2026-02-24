<?php

declare(strict_types=1);

namespace App\Tests\Unit\State;

use ApiPlatform\Doctrine\Common\State\PersistProcessor;
use ApiPlatform\Metadata\Operation;
use App\Entity\Player;
use App\Entity\ScoreEntry;
use App\Entity\Session;
use App\Entity\StarEvent;
use App\Repository\SessionRepository;
use App\Repository\StarEventRepository;
use App\Service\BadgeChecker;
use App\State\StarEventCreateProcessor;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class StarEventCreateProcessorTest extends TestCase
{
    private BadgeChecker&MockObject $badgeChecker;
    private EntityManagerInterface&MockObject $em;
    private Operation&MockObject $operation;
    private PersistProcessor&MockObject $persistProcessor;
    private StarEventCreateProcessor $processor;
    private SessionRepository&MockObject $sessionRepository;
    private StarEventRepository&MockObject $starEventRepository;

    protected function setUp(): void
    {
        $this->badgeChecker = $this->createMock(BadgeChecker::class);
        $this->em = $this->createMock(EntityManagerInterface::class);
        $this->operation = $this->createMock(Operation::class);
        $this->persistProcessor = $this->createMock(PersistProcessor::class);
        $this->sessionRepository = $this->createMock(SessionRepository::class);
        $this->starEventRepository = $this->createMock(StarEventRepository::class);

        $this->processor = new StarEventCreateProcessor(
            $this->badgeChecker,
            $this->em,
            $this->persistProcessor,
            $this->sessionRepository,
            $this->starEventRepository,
        );
    }

    public function testSetsSessionAndPersists(): void
    {
        $player = $this->createPlayer(1);
        $session = $this->createSessionWithPlayers(10, [$player]);

        $starEvent = new StarEvent();
        $starEvent->setPlayer($player);

        $this->sessionRepository->method('find')->with(10)->willReturn($session);
        $this->persistProcessor->expects($this->once())
            ->method('process')
            ->with($starEvent, $this->operation, ['sessionId' => 10], [])
            ->willReturn($starEvent);
        $this->starEventRepository->method('countBySessionAndPlayer')->willReturn(1);
        $this->badgeChecker->method('checkAndAward')->willReturn([]);

        $result = $this->processor->process($starEvent, $this->operation, ['sessionId' => 10]);

        $this->assertSame($session, $starEvent->getSession());
        $this->assertSame($starEvent, $result);
    }

    public function testThrowsOnMissingSession(): void
    {
        $this->sessionRepository->method('find')->with(99)->willReturn(null);

        $starEvent = new StarEvent();

        $this->expectException(UnprocessableEntityHttpException::class);
        $this->expectExceptionMessage('Session introuvable.');

        $this->processor->process($starEvent, $this->operation, ['sessionId' => 99]);
    }

    public function testThrowsOnPlayerNotInSession(): void
    {
        $playerInSession = $this->createPlayer(1);
        $playerOutside = $this->createPlayer(2);
        $session = $this->createSessionWithPlayers(10, [$playerInSession]);

        $starEvent = new StarEvent();
        $starEvent->setPlayer($playerOutside);

        $this->sessionRepository->method('find')->with(10)->willReturn($session);

        $this->expectException(UnprocessableEntityHttpException::class);
        $this->expectExceptionMessage('Le joueur n\'appartient pas à la session.');

        $this->processor->process($starEvent, $this->operation, ['sessionId' => 10]);
    }

    public function testPenaltyOnMultiplesOfThree(): void
    {
        $penalized = $this->createPlayer(1);
        $others = [
            $this->createPlayer(2),
            $this->createPlayer(3),
            $this->createPlayer(4),
            $this->createPlayer(5),
        ];
        $allPlayers = \array_merge([$penalized], $others);
        $session = $this->createSessionWithPlayers(10, $allPlayers);

        $starEvent = new StarEvent();
        $starEvent->setPlayer($penalized);

        $this->sessionRepository->method('find')->with(10)->willReturn($session);
        $this->persistProcessor->method('process')->willReturn($starEvent);
        $this->starEventRepository->method('countBySessionAndPlayer')
            ->with($session, $penalized)
            ->willReturn(3);
        $this->badgeChecker->method('checkAndAward')->willReturn([]);

        $persistedEntries = [];
        $this->em->expects($this->exactly(5))
            ->method('persist')
            ->willReturnCallback(static function (ScoreEntry $entry) use (&$persistedEntries): void {
                $persistedEntries[] = $entry;
            });
        $this->em->expects($this->once())->method('flush');

        $this->processor->process($starEvent, $this->operation, ['sessionId' => 10]);

        $this->assertCount(5, $persistedEntries);

        foreach ($persistedEntries as $entry) {
            $this->assertSame($session, $entry->getSession());

            if (1 === $entry->getPlayer()->getId()) {
                $this->assertSame(-100, $entry->getScore());
            } else {
                $this->assertSame(25, $entry->getScore());
            }
        }
    }

    public function testNoPenaltyOnNonMultiple(): void
    {
        $player = $this->createPlayer(1);
        $session = $this->createSessionWithPlayers(10, [$player]);

        $starEvent = new StarEvent();
        $starEvent->setPlayer($player);

        $this->sessionRepository->method('find')->with(10)->willReturn($session);
        $this->persistProcessor->method('process')->willReturn($starEvent);
        $this->starEventRepository->method('countBySessionAndPlayer')
            ->with($session, $player)
            ->willReturn(2);
        $this->badgeChecker->method('checkAndAward')->willReturn([]);

        $this->em->expects($this->never())->method('persist');
        $this->em->expects($this->never())->method('flush');

        $this->processor->process($starEvent, $this->operation, ['sessionId' => 10]);
    }

    private function createPlayer(int $id): Player
    {
        $player = new Player();
        $player->setName('Player '.$id);

        $ref = new \ReflectionProperty(Player::class, 'id');
        $ref->setValue($player, $id);

        return $player;
    }

    private function createSessionWithPlayers(int $sessionId, array $players): Session
    {
        $session = new Session();

        $ref = new \ReflectionProperty(Session::class, 'id');
        $ref->setValue($session, $sessionId);

        foreach ($players as $player) {
            $session->addPlayer($player);
        }

        return $session;
    }
}
