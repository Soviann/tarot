<?php

declare(strict_types=1);

namespace App\Tests\Unit\State;

use ApiPlatform\Doctrine\Common\State\PersistProcessor;
use ApiPlatform\Metadata\Operation;
use App\Entity\Player;
use App\Entity\PlayerGroup;
use App\Entity\Session;
use App\Repository\PlayerGroupRepository;
use App\Repository\SessionRepository;
use App\State\SessionCreateProcessor;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\MockObject\Stub;
use PHPUnit\Framework\TestCase;

class SessionCreateProcessorTest extends TestCase
{
    private EntityManagerInterface&MockObject $em;
    private PersistProcessor&Stub $persistProcessor;
    private PlayerGroupRepository&Stub $playerGroupRepository;
    private SessionCreateProcessor $processor;
    private SessionRepository&Stub $sessionRepository;

    protected function setUp(): void
    {
        $this->em = $this->createMock(EntityManagerInterface::class);
        $this->persistProcessor = $this->createStub(PersistProcessor::class);
        $this->playerGroupRepository = $this->createStub(PlayerGroupRepository::class);
        $this->sessionRepository = $this->createStub(SessionRepository::class);

        $this->processor = new SessionCreateProcessor(
            $this->em,
            $this->persistProcessor,
            $this->playerGroupRepository,
            $this->sessionRepository,
        );
    }

    public function testReturnsExistingActiveSession(): void
    {
        $players = $this->createPlayers(5);
        $session = $this->createSession($players);

        $existingSession = new Session();
        $this->setId($existingSession, 99);

        $sessionRepository = $this->createMock(SessionRepository::class);
        $sessionRepository->expects($this->once())
            ->method('findActiveWithExactPlayers')
            ->with([1, 2, 3, 4, 5], 5)
            ->willReturn($existingSession);

        $persistProcessor = $this->createMock(PersistProcessor::class);
        $persistProcessor->expects($this->never())->method('process');
        $this->em->expects($this->never())->method('flush');

        $processor = $this->createProcessorWith(
            persistProcessor: $persistProcessor,
            sessionRepository: $sessionRepository,
        );

        $operation = $this->createStub(Operation::class);
        $result = $processor->process($session, $operation);

        $this->assertSame($existingSession, $result);
    }

    public function testCreatesNewWithDealerAndPlayerOrder(): void
    {
        $players = $this->createPlayers(5);
        $session = $this->createSession($players);

        $this->sessionRepository->method('findActiveWithExactPlayers')->willReturn(null);

        $persistProcessor = $this->createMock(PersistProcessor::class);
        $persistProcessor->expects($this->once())
            ->method('process')
            ->willReturn($session);

        $processor = $this->createProcessorWith(persistProcessor: $persistProcessor);

        $this->playerGroupRepository->method('findMatchingExactPlayers')->willReturn([]);
        $this->em->expects($this->once())->method('flush');

        $operation = $this->createStub(Operation::class);
        $result = $processor->process($session, $operation);

        $this->assertSame($session, $result);
        $this->assertSame($players[0], $result->getCurrentDealer());
        $this->assertSame([1, 2, 3, 4, 5], $result->getPlayerOrder());
    }

    public function testAutoAssociatesMatchingGroup(): void
    {
        $players = $this->createPlayers(5);
        $session = $this->createSession($players);

        $group = new PlayerGroup();
        $group->setName('Groupe A');
        $this->setId($group, 10);
        foreach ($players as $player) {
            $group->addPlayer($player);
        }

        $this->sessionRepository->method('findActiveWithExactPlayers')->willReturn(null);
        $this->persistProcessor->method('process')->willReturn($session);
        $this->playerGroupRepository->method('findMatchingExactPlayers')
            ->willReturn([$group]);
        $this->em->expects($this->once())->method('flush');

        $operation = $this->createStub(Operation::class);
        $result = $this->processor->process($session, $operation);

        $this->assertSame($group, $result->getPlayerGroup());
    }

    public function testNoGroupOnMultipleMatches(): void
    {
        $players = $this->createPlayers(5);
        $session = $this->createSession($players);

        $group1 = new PlayerGroup();
        $group1->setName('Groupe A');
        $this->setId($group1, 10);
        $group2 = new PlayerGroup();
        $group2->setName('Groupe B');
        $this->setId($group2, 11);

        foreach ([$group1, $group2] as $group) {
            foreach ($players as $player) {
                $group->addPlayer($player);
            }
        }

        $this->sessionRepository->method('findActiveWithExactPlayers')->willReturn(null);
        $this->persistProcessor->method('process')->willReturn($session);
        $this->playerGroupRepository->method('findMatchingExactPlayers')
            ->willReturn([$group1, $group2]);
        $this->em->expects($this->once())->method('flush');

        $operation = $this->createStub(Operation::class);
        $result = $this->processor->process($session, $operation);

        $this->assertNull($result->getPlayerGroup());
    }

    public function testNoGroupOnNoMatch(): void
    {
        $players = $this->createPlayers(5);
        $session = $this->createSession($players);

        $this->sessionRepository->method('findActiveWithExactPlayers')->willReturn(null);
        $this->persistProcessor->method('process')->willReturn($session);
        $this->playerGroupRepository->method('findMatchingExactPlayers')
            ->willReturn([]);
        $this->em->expects($this->once())->method('flush');

        $operation = $this->createStub(Operation::class);
        $result = $this->processor->process($session, $operation);

        $this->assertNull($result->getPlayerGroup());
    }

    private function createProcessorWith(
        ?PersistProcessor $persistProcessor = null,
        ?SessionRepository $sessionRepository = null,
    ): SessionCreateProcessor {
        return new SessionCreateProcessor(
            $this->em,
            $persistProcessor ?? $this->persistProcessor,
            $this->playerGroupRepository,
            $sessionRepository ?? $this->sessionRepository,
        );
    }

    /**
     * @return Player[]
     */
    private function createPlayers(int $count): array
    {
        $players = [];
        for ($i = 1; $i <= $count; ++$i) {
            $player = new Player();
            $player->setName("Player{$i}");
            $this->setId($player, $i);
            $players[] = $player;
        }

        return $players;
    }

    /**
     * @param Player[] $players
     */
    private function createSession(array $players): Session
    {
        $session = new Session();
        $this->setId($session, 1);
        foreach ($players as $player) {
            $session->addPlayer($player);
        }

        return $session;
    }

    private function setId(object $entity, int $id): void
    {
        $ref = new \ReflectionProperty($entity, 'id');
        $ref->setValue($entity, $id);
    }
}
