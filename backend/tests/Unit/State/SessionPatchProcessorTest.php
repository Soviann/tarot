<?php

declare(strict_types=1);

namespace App\Tests\Unit\State;

use ApiPlatform\Doctrine\Common\State\PersistProcessor;
use ApiPlatform\Metadata\Operation;
use App\Entity\Player;
use App\Entity\PlayerGroup;
use App\Entity\Session;
use App\State\SessionPatchProcessor;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\UnitOfWork;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class SessionPatchProcessorTest extends TestCase
{
    private EntityManagerInterface&MockObject $em;
    private PersistProcessor&MockObject $persistProcessor;
    private SessionPatchProcessor $processor;
    private UnitOfWork&MockObject $uow;

    protected function setUp(): void
    {
        $this->em = $this->createMock(EntityManagerInterface::class);
        $this->persistProcessor = $this->createMock(PersistProcessor::class);
        $this->uow = $this->createMock(UnitOfWork::class);

        $this->em->method('getUnitOfWork')->willReturn($this->uow);

        $this->processor = new SessionPatchProcessor(
            $this->em,
            $this->persistProcessor,
        );
    }

    public function testPreventsReactivation(): void
    {
        $session = new Session();
        $session->setIsActive(true);

        $this->uow->method('getOriginalEntityData')
            ->with($session)
            ->willReturn(['isActive' => false]);

        $operation = $this->createMock(Operation::class);

        $this->expectException(UnprocessableEntityHttpException::class);
        $this->expectExceptionMessage('Une session terminée ne peut pas être réouverte.');

        $this->processor->process($session, $operation);
    }

    public function testAllowsDeactivation(): void
    {
        $session = new Session();
        $session->setIsActive(false);

        $this->uow->method('getOriginalEntityData')
            ->with($session)
            ->willReturn(['isActive' => true]);

        $this->persistProcessor->expects($this->once())
            ->method('process')
            ->willReturn($session);

        $operation = $this->createMock(Operation::class);
        $result = $this->processor->process($session, $operation);

        $this->assertSame($session, $result);
    }

    public function testPropagatesPlayersToGroup(): void
    {
        $players = $this->createPlayers(5);

        $group = new PlayerGroup();
        $group->setName('Groupe A');
        $this->setId($group, 10);
        // Group only has 3 of the 5 players
        $group->addPlayer($players[0]);
        $group->addPlayer($players[1]);
        $group->addPlayer($players[2]);

        $session = new Session();
        $this->setId($session, 1);
        $session->setPlayerGroup($group);
        foreach ($players as $player) {
            $session->addPlayer($player);
        }
        $session->setIsActive(true);

        $this->uow->method('getOriginalEntityData')
            ->with($session)
            ->willReturn(['isActive' => true]);

        $this->persistProcessor->method('process')->willReturn($session);
        $this->em->expects($this->once())->method('flush');

        $operation = $this->createMock(Operation::class);
        $this->processor->process($session, $operation);

        // All 5 players should now be in the group
        $this->assertCount(5, $group->getPlayers());
        foreach ($players as $player) {
            $this->assertTrue(
                $group->getPlayers()->contains($player),
                \sprintf('Group should contain %s', $player->getName()),
            );
        }
    }

    public function testNoFlushIfGroupAlreadyHasAllPlayers(): void
    {
        $players = $this->createPlayers(5);

        $group = new PlayerGroup();
        $group->setName('Groupe A');
        $this->setId($group, 10);
        foreach ($players as $player) {
            $group->addPlayer($player);
        }

        $session = new Session();
        $this->setId($session, 1);
        $session->setPlayerGroup($group);
        foreach ($players as $player) {
            $session->addPlayer($player);
        }
        $session->setIsActive(true);

        $this->uow->method('getOriginalEntityData')
            ->with($session)
            ->willReturn(['isActive' => true]);

        $this->persistProcessor->method('process')->willReturn($session);
        // flush should NOT be called since no player was added
        $this->em->expects($this->never())->method('flush');

        $operation = $this->createMock(Operation::class);
        $this->processor->process($session, $operation);
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

    private function setId(object $entity, int $id): void
    {
        $ref = new \ReflectionProperty($entity, 'id');
        $ref->setValue($entity, $id);
    }
}
