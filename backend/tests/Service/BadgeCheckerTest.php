<?php

declare(strict_types=1);

namespace App\Tests\Service;

use App\Entity\Game;
use App\Entity\Player;
use App\Entity\ScoreEntry;
use App\Entity\Session;
use App\Entity\StarEvent;
use App\Enum\BadgeType;
use App\Enum\Chelem;
use App\Enum\Contract;
use App\Enum\GameStatus;
use App\Enum\Side;
use App\Repository\GameRepository;
use App\Repository\PlayerBadgeRepository;
use App\Repository\ScoreEntryRepository;
use App\Repository\SessionRepository;
use App\Repository\StarEventRepository;
use App\Service\BadgeChecker;
use App\Tests\Api\ApiTestCase;

class BadgeCheckerTest extends ApiTestCase
{
    private BadgeChecker $checker;

    protected function setUp(): void
    {
        parent::setUp();

        $gameRepository = $this->em->getRepository(Game::class);
        \assert($gameRepository instanceof GameRepository);

        $playerBadgeRepository = self::getContainer()->get(PlayerBadgeRepository::class);
        \assert($playerBadgeRepository instanceof PlayerBadgeRepository);

        $scoreEntryRepository = $this->em->getRepository(ScoreEntry::class);
        \assert($scoreEntryRepository instanceof ScoreEntryRepository);

        $sessionRepository = $this->em->getRepository(Session::class);
        \assert($sessionRepository instanceof SessionRepository);

        $starEventRepository = $this->em->getRepository(StarEvent::class);
        \assert($starEventRepository instanceof StarEventRepository);

        $this->checker = new BadgeChecker(
            $this->em,
            $gameRepository,
            $playerBadgeRepository,
            $scoreEntryRepository,
            $sessionRepository,
            $starEventRepository,
        );
    }

    public function testFirstGameBadge(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();

        $this->completeGame($session, $players[0]);

        $result = $this->checker->checkAndAward($session);

        foreach ($players as $player) {
            self::assertContains(
                BadgeType::FirstGame,
                $result[$player->getId()],
                \sprintf('%s should have received FirstGame badge', $player->getName()),
            );
        }
    }

    public function testNoDuplicateBadges(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();

        $this->completeGame($session, $players[0]);

        $first = $this->checker->checkAndAward($session);
        self::assertNotEmpty($first);

        $second = $this->checker->checkAndAward($session);

        foreach ($players as $player) {
            $badges = $second[$player->getId()] ?? [];
            self::assertEmpty($badges, \sprintf('%s should not receive duplicate badges', $player->getName()));
        }
    }

    public function testKamikazeBadge(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $taker = $session->getPlayers()->toArray()[0];

        $this->completeGame($session, $taker, Contract::GardeContre);

        $result = $this->checker->checkAndAward($session);

        self::assertContains(BadgeType::Kamikaze, $result[$taker->getId()]);
    }

    public function testNoNetBadge(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $taker = $session->getPlayers()->toArray()[0];

        // Winning GardeSans: taker score > 0
        $this->completeGame($session, $taker, Contract::GardeSans, points: 56);

        $result = $this->checker->checkAndAward($session);

        self::assertContains(BadgeType::NoNet, $result[$taker->getId()]);
    }

    public function testNoNetBadgeNotAwardedOnLoss(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $taker = $session->getPlayers()->toArray()[0];

        // Losing GardeSans: taker score < 0 (low points)
        $this->completeGame($session, $taker, Contract::GardeSans, points: 30, takerScore: -200);

        $result = $this->checker->checkAndAward($session);

        $takerBadges = $result[$taker->getId()] ?? [];
        self::assertNotContains(BadgeType::NoNet, $takerBadges);
    }

    public function testFirstChelemBadge(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $taker = $session->getPlayers()->toArray()[0];

        $this->completeGame($session, $taker, chelem: Chelem::AnnouncedWon);

        $result = $this->checker->checkAndAward($session);

        self::assertContains(BadgeType::FirstChelem, $result[$taker->getId()]);
    }

    public function testNightOwlBadge(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();

        $this->completeGame(
            $session,
            $players[0],
            completedAt: new \DateTimeImmutable('2025-06-15 01:30:00'),
        );

        $result = $this->checker->checkAndAward($session);

        foreach ($players as $player) {
            self::assertContains(
                BadgeType::NightOwl,
                $result[$player->getId()],
                \sprintf('%s should have received NightOwl badge', $player->getName()),
            );
        }
    }

    public function testStarCollectorBadge(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $player = $session->getPlayers()->toArray()[0];

        // Complete a game so checkAndAward has something to work with
        $this->completeGame($session, $player);

        // Create 10 star events for the player
        for ($i = 0; $i < 10; ++$i) {
            $star = new StarEvent();
            $star->setPlayer($player);
            $star->setSession($session);
            $this->em->persist($star);
        }
        $this->em->flush();

        $result = $this->checker->checkAndAward($session);

        self::assertContains(BadgeType::StarCollector, $result[$player->getId()]);
    }

    public function testCenturionBadge(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();

        for ($i = 0; $i < 100; ++$i) {
            $this->completeGame($session, $players[$i % 5]);
        }

        $result = $this->checker->checkAndAward($session);

        foreach ($players as $player) {
            self::assertContains(
                BadgeType::Centurion,
                $result[$player->getId()],
                \sprintf('%s should have received Centurion badge', $player->getName()),
            );
        }
    }

    /**
     * Helper to create a completed game with score entries.
     */
    private function completeGame(
        Session $session,
        Player $taker,
        Contract $contract = Contract::Petite,
        Chelem $chelem = Chelem::None,
        float $points = 56,
        int $oudlers = 3,
        ?\DateTimeImmutable $completedAt = null,
        ?Player $partner = null,
        Side $petitAuBout = Side::None,
        ?int $takerScore = null,
    ): Game {
        $game = new Game();
        $game->setChelem($chelem);
        $game->setCompletedAt($completedAt ?? new \DateTimeImmutable());
        $game->setContract($contract);
        $game->setOudlers($oudlers);
        $game->setPartner($partner);
        $game->setPetitAuBout($petitAuBout);
        $game->setPoints($points);
        $game->setPosition($session->getGames()->count() + 1);
        $game->setSession($session);
        $game->setStatus(GameStatus::Completed);
        $game->setTaker($taker);

        $this->em->persist($game);
        $session->addGame($game);

        // Compute taker score: if not explicitly provided, use a simple default
        $actualTakerScore = $takerScore ?? 100;
        $defenseScore = (int) (-$actualTakerScore / 4);

        $players = $session->getPlayers()->toArray();
        foreach ($players as $player) {
            $entry = new ScoreEntry();
            $entry->setGame($game);
            $entry->setPlayer($player);
            $entry->setSession($session);

            if ($player->getId() === $taker->getId()) {
                $entry->setScore($actualTakerScore);
            } elseif (null !== $partner && $player->getId() === $partner->getId()) {
                $entry->setScore((int) ($actualTakerScore / 2));
            } else {
                $entry->setScore($defenseScore);
            }

            $this->em->persist($entry);
            $game->addScoreEntry($entry);
        }

        $this->em->flush();

        return $game;
    }
}
