<?php

declare(strict_types=1);

namespace App\Tests\Unit\State;

use ApiPlatform\Doctrine\Common\State\PersistProcessor;
use ApiPlatform\Metadata\Operation;
use App\Entity\Game;
use App\Entity\Player;
use App\Entity\ScoreEntry;
use App\Entity\Session;
use App\Enum\BadgeType;
use App\Enum\Contract;
use App\Enum\GameStatus;
use App\Service\BadgeChecker;
use App\Service\Scoring\EloCalculator;
use App\Service\Scoring\ScoreCalculator;
use App\State\EloRevertHelper;
use App\State\GameCompleteProcessor;
use Doctrine\ORM\EntityManagerInterface;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

class GameCompleteProcessorTest extends TestCase
{
    private BadgeChecker&MockObject $badgeChecker;
    private EloCalculator&MockObject $eloCalculator;
    private EloRevertHelper&MockObject $eloRevertHelper;
    private EntityManagerInterface&MockObject $em;
    private PersistProcessor&MockObject $persistProcessor;
    private GameCompleteProcessor $processor;
    private ScoreCalculator&MockObject $scoreCalculator;

    protected function setUp(): void
    {
        $this->badgeChecker = $this->createMock(BadgeChecker::class);
        $this->eloCalculator = $this->createMock(EloCalculator::class);
        $this->eloRevertHelper = $this->createMock(EloRevertHelper::class);
        $this->em = $this->createMock(EntityManagerInterface::class);
        $this->persistProcessor = $this->createMock(PersistProcessor::class);
        $this->scoreCalculator = $this->createMock(ScoreCalculator::class);

        $this->processor = new GameCompleteProcessor(
            $this->badgeChecker,
            $this->eloCalculator,
            $this->eloRevertHelper,
            $this->em,
            $this->persistProcessor,
            $this->scoreCalculator,
        );
    }

    public function testFirstCompletionComputesScoresEloSetsCompletedAtAdvancesDealerAndChecksBadges(): void
    {
        $players = $this->createPlayers(5);
        $session = $this->createSession($players);
        $session->setCurrentDealer($players[0]);
        $session->setPlayerOrder([1, 2, 3, 4, 5]);

        $game = $this->createCompletedGame($session, $players[0]);

        $scoreEntries = [new ScoreEntry(), new ScoreEntry()];
        $this->scoreCalculator->expects($this->once())
            ->method('compute')
            ->with($game)
            ->willReturn($scoreEntries);

        $eloResults = [];
        foreach ($players as $player) {
            $id = $player->getId();
            $eloResults[] = [
                'playerId' => $id,
                'playerName' => $player->getName(),
                'ratingAfter' => 1520,
                'ratingBefore' => 1500,
                'ratingChange' => 20,
            ];
        }
        $this->eloCalculator->expects($this->once())
            ->method('compute')
            ->willReturn($eloResults);

        $this->eloRevertHelper->expects($this->never())->method('revert');

        $this->persistProcessor->expects($this->once())
            ->method('process')
            ->willReturn($game);

        $this->badgeChecker->expects($this->once())
            ->method('checkAndAward')
            ->with($session)
            ->willReturn([]);

        $operation = $this->createMock(Operation::class);
        $result = $this->processor->process($game, $operation);

        $this->assertSame($game, $result);
        $this->assertNotNull($game->getCompletedAt());
        // Dealer advanced from player 0 (id=1) to player 1 (id=2)
        $this->assertSame($players[1], $session->getCurrentDealer());
        // Score entries added
        $this->assertFalse($game->getScoreEntries()->isEmpty());
    }

    public function testEditRecomputesAfterRevert(): void
    {
        $players = $this->createPlayers(5);
        $session = $this->createSession($players);
        $session->setCurrentDealer($players[0]);
        $session->setPlayerOrder([1, 2, 3, 4, 5]);

        $game = $this->createCompletedGame($session, $players[0]);
        // Pre-existing score entry to simulate wasAlreadyCompleted=true
        $existingEntry = new ScoreEntry();
        $game->addScoreEntry($existingEntry);

        $this->eloRevertHelper->expects($this->once())
            ->method('revert')
            ->with($game);

        $this->em->expects($this->atLeastOnce())->method('remove');

        $this->scoreCalculator->expects($this->once())
            ->method('compute')
            ->with($game)
            ->willReturn([new ScoreEntry()]);

        $eloResults = [];
        foreach ($players as $player) {
            $eloResults[] = [
                'playerId' => $player->getId(),
                'playerName' => $player->getName(),
                'ratingAfter' => 1520,
                'ratingBefore' => 1500,
                'ratingChange' => 20,
            ];
        }
        $this->eloCalculator->expects($this->once())
            ->method('compute')
            ->willReturn($eloResults);

        $this->persistProcessor->expects($this->once())
            ->method('process')
            ->willReturn($game);

        // Badges NOT checked on edit
        $this->badgeChecker->expects($this->never())->method('checkAndAward');

        $completedAtBefore = $game->getCompletedAt();
        $dealerBefore = $session->getCurrentDealer();

        $operation = $this->createMock(Operation::class);
        $this->processor->process($game, $operation);

        // completedAt not changed (was already completed)
        $this->assertSame($completedAtBefore, $game->getCompletedAt());
        // Dealer not advanced
        $this->assertSame($dealerBefore, $session->getCurrentDealer());
    }

    public function testNonCompletedStatusSkipsAllComputation(): void
    {
        $game = new Game();
        $game->setContract(Contract::Petite);
        $game->setStatus(GameStatus::InProgress);

        $session = new Session();
        $game->setSession($session);
        $taker = new Player();
        $taker->setName('Taker');
        $this->setId($taker, 1);
        $game->setTaker($taker);

        $this->scoreCalculator->expects($this->never())->method('compute');
        $this->eloCalculator->expects($this->never())->method('compute');
        $this->eloRevertHelper->expects($this->never())->method('revert');
        $this->badgeChecker->expects($this->never())->method('checkAndAward');

        $this->persistProcessor->expects($this->once())
            ->method('process')
            ->willReturn($game);

        $operation = $this->createMock(Operation::class);
        $result = $this->processor->process($game, $operation);

        $this->assertSame($game, $result);
    }

    public function testLastActivityAtUpdatedOnFirstCompletion(): void
    {
        $players = $this->createPlayers(5);
        $session = $this->createSession($players);
        $session->setCurrentDealer($players[0]);
        $session->setPlayerOrder([1, 2, 3, 4, 5]);

        $game = $this->createCompletedGame($session, $players[0]);

        $this->scoreCalculator->method('compute')->willReturn([]);

        $eloResults = [];
        foreach ($players as $player) {
            $eloResults[] = [
                'playerId' => $player->getId(),
                'playerName' => $player->getName(),
                'ratingAfter' => 1500,
                'ratingBefore' => 1500,
                'ratingChange' => 0,
            ];
        }
        $this->eloCalculator->method('compute')->willReturn($eloResults);
        $this->persistProcessor->method('process')->willReturn($game);
        $this->badgeChecker->method('checkAndAward')->willReturn([]);

        $operation = $this->createMock(Operation::class);
        $this->processor->process($game, $operation);

        foreach ($players as $player) {
            $this->assertNotNull(
                $player->getLastActivityAt(),
                \sprintf('Player %s should have lastActivityAt set', $player->getName()),
            );
        }
    }

    public function testBadgesSetOnNewBadges(): void
    {
        $players = $this->createPlayers(5);
        $session = $this->createSession($players);
        $session->setCurrentDealer($players[0]);
        $session->setPlayerOrder([1, 2, 3, 4, 5]);

        $game = $this->createCompletedGame($session, $players[0]);

        $this->scoreCalculator->method('compute')->willReturn([]);
        $eloResults = [];
        foreach ($players as $player) {
            $eloResults[] = [
                'playerId' => $player->getId(),
                'playerName' => $player->getName(),
                'ratingAfter' => 1500,
                'ratingBefore' => 1500,
                'ratingChange' => 0,
            ];
        }
        $this->eloCalculator->method('compute')->willReturn($eloResults);
        $this->persistProcessor->method('process')->willReturn($game);

        $this->badgeChecker->method('checkAndAward')
            ->willReturn([1 => [BadgeType::FirstGame]]);

        $operation = $this->createMock(Operation::class);
        $result = $this->processor->process($game, $operation);

        $this->assertNotNull($result->getNewBadges());
    }

    public function testBadgesNotSetWhenEmpty(): void
    {
        $players = $this->createPlayers(5);
        $session = $this->createSession($players);
        $session->setCurrentDealer($players[0]);
        $session->setPlayerOrder([1, 2, 3, 4, 5]);

        $game = $this->createCompletedGame($session, $players[0]);

        $this->scoreCalculator->method('compute')->willReturn([]);
        $eloResults = [];
        foreach ($players as $player) {
            $eloResults[] = [
                'playerId' => $player->getId(),
                'playerName' => $player->getName(),
                'ratingAfter' => 1500,
                'ratingBefore' => 1500,
                'ratingChange' => 0,
            ];
        }
        $this->eloCalculator->method('compute')->willReturn($eloResults);
        $this->persistProcessor->method('process')->willReturn($game);
        $this->badgeChecker->method('checkAndAward')->willReturn([]);

        $operation = $this->createMock(Operation::class);
        $result = $this->processor->process($game, $operation);

        $this->assertNull($result->getNewBadges());
    }

    public function testPersistProcessorCalledAlways(): void
    {
        $game = new Game();
        $game->setContract(Contract::Petite);
        $game->setStatus(GameStatus::InProgress);

        $session = new Session();
        $game->setSession($session);
        $taker = new Player();
        $taker->setName('Taker');
        $this->setId($taker, 1);
        $game->setTaker($taker);

        $operation = $this->createMock(Operation::class);
        $uriVariables = ['id' => 1];
        $context = ['groups' => ['game:complete']];

        $this->persistProcessor->expects($this->once())
            ->method('process')
            ->with($game, $operation, $uriVariables, $context)
            ->willReturn($game);

        $this->processor->process($game, $operation, $uriVariables, $context);
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
            $player->setEloRating(1500);
            $this->setId($player, $i);
            $players[] = $player;
        }

        return $players;
    }

    private function createCompletedGame(Session $session, Player $taker): Game
    {
        $game = new Game();
        $game->setContract(Contract::Petite);
        $game->setOudlers(2);
        $game->setPoints(50.0);
        $game->setSession($session);
        $game->setStatus(GameStatus::Completed);
        $game->setTaker($taker);
        $this->setId($game, 1);

        return $game;
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
