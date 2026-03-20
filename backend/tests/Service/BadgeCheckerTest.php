<?php

declare(strict_types=1);

namespace App\Tests\Service;

use App\Entity\Game;
use App\Entity\Player;
use App\Entity\PlayerBadge;
use App\Entity\ScoreEntry;
use App\Entity\Session;
use App\Entity\StarEvent;
use App\Enum\BadgeType;
use App\Enum\Chelem;
use App\Enum\Contract;
use App\Enum\Poignee;
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

    public function testGardeContreWonBadge(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $taker = $session->getPlayers()->toArray()[0];

        // Win a GardeContre (taker score > 0)
        $this->completeGame($session, $taker, Contract::GardeContre, points: 56);

        $result = $this->checker->checkAndAward($session);

        self::assertContains(BadgeType::GardeContreWon, $result[$taker->getId()]);
    }

    public function testThreeOutlersLossBadge(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $taker = $session->getPlayers()->toArray()[0];

        // Lose with 3 oudlers: required is 36, points < 36 → loss
        $this->completeGame($session, $taker, oudlers: 3, points: 35, takerScore: -50);

        $result = $this->checker->checkAndAward($session);

        self::assertContains(BadgeType::ThreeOutlersLoss, $result[$taker->getId()]);
    }

    public function testCloseCallBadge(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $taker = $session->getPlayers()->toArray()[0];

        // 3 oudlers → required=36. Points=35 → deficit=1 (< 2) → close call
        $this->completeGame($session, $taker, oudlers: 3, points: 35, takerScore: -50);

        $result = $this->checker->checkAndAward($session);

        self::assertContains(BadgeType::CloseCall, $result[$taker->getId()]);
    }

    public function testComfortable10Badge(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $taker = $session->getPlayers()->toArray()[0];

        // 3 oudlers → required=36. Points=47 → margin=11 (> 10)
        $this->completeGame($session, $taker, oudlers: 3, points: 47);

        $result = $this->checker->checkAndAward($session);

        self::assertContains(BadgeType::Comfortable10, $result[$taker->getId()]);
    }

    public function testRisingStarBadge(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $player = $session->getPlayers()->toArray()[0];

        $this->completeGame($session, $player);

        for ($i = 0; $i < 20; ++$i) {
            $star = new StarEvent();
            $star->setPlayer($player);
            $star->setSession($session);
            $this->em->persist($star);
        }
        $this->em->flush();

        $result = $this->checker->checkAndAward($session);

        self::assertContains(BadgeType::RisingStar, $result[$player->getId()]);
    }

    public function testStarShowerBadge(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $player = $session->getPlayers()->toArray()[0];

        $this->completeGame($session, $player);

        // Create 3 star events within 1 hour
        $baseTime = new \DateTimeImmutable('2025-06-15 14:00:00');
        for ($i = 0; $i < 3; ++$i) {
            $star = new StarEvent();
            $star->setPlayer($player);
            $star->setSession($session);
            $star->setCreatedAt($baseTime->modify(\sprintf('+%d minutes', $i * 30)));
            $this->em->persist($star);
        }
        $this->em->flush();

        $result = $this->checker->checkAndAward($session);

        self::assertContains(BadgeType::StarShower, $result[$player->getId()]);
    }

    public function testSurpriseChelemBadge(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $taker = $session->getPlayers()->toArray()[0];

        $this->completeGame($session, $taker, chelem: Chelem::NotAnnouncedWon);

        $result = $this->checker->checkAndAward($session);

        self::assertContains(BadgeType::SurpriseChelem, $result[$taker->getId()]);
    }

    public function testTriplePoigneeBadgeAsTaker(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $taker = $session->getPlayers()->toArray()[0];

        $this->completeGame($session, $taker, poignee: Poignee::Triple, poigneeOwner: Side::Attack);

        $result = $this->checker->checkAndAward($session);

        self::assertContains(BadgeType::TriplePoignee, $result[$taker->getId()]);
    }

    public function testTriplePoigneeBadgeAsDefense(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();
        $taker = $players[0];
        $defender = $players[2];

        $this->completeGame($session, $taker, poignee: Poignee::Triple, poigneeOwner: Side::Defense);

        $result = $this->checker->checkAndAward($session);

        self::assertContains(BadgeType::TriplePoignee, $result[$defender->getId()]);
    }

    public function testZeroBoutBadge(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $taker = $session->getPlayers()->toArray()[0];

        // 0 oudlers → required=56. Points=57 → win
        $this->completeGame($session, $taker, oudlers: 0, points: 57);

        $result = $this->checker->checkAndAward($session);

        self::assertContains(BadgeType::ZeroBout, $result[$taker->getId()]);
    }

    public function testSelfCallerBadge(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $taker = $session->getPlayers()->toArray()[0];

        // Win with no partner (self-call)
        $this->completeGame($session, $taker);

        $result = $this->checker->checkAndAward($session);

        self::assertContains(BadgeType::SelfCaller, $result[$taker->getId()]);
    }

    public function testLosingStreakBadge(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $taker = $session->getPlayers()->toArray()[0];

        // 5 consecutive losses as taker
        for ($i = 0; $i < 5; ++$i) {
            $this->completeGame($session, $taker, points: 30, takerScore: -100);
        }

        $result = $this->checker->checkAndAward($session);

        self::assertContains(BadgeType::LosingStreak, $result[$taker->getId()]);
    }

    public function testAudaciousBadge(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $taker = $session->getPlayers()->toArray()[0];

        $this->completeGame($session, $taker, chelem: Chelem::AnnouncedLost, takerScore: -200);

        $result = $this->checker->checkAndAward($session);

        self::assertContains(BadgeType::Audacious, $result[$taker->getId()]);
    }

    public function testKonamiBadgeNotAutoAwarded(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $taker = $session->getPlayers()->toArray()[0];

        $this->completeGame($session, $taker);

        $result = $this->checker->checkAndAward($session);

        $takerBadges = $result[$taker->getId()] ?? [];
        self::assertNotContains(BadgeType::Konami, $takerBadges);
    }

    public function testWallBadge(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();
        $defender = $players[1]; // Bob will be on defense for all games

        // 10 consecutive defense wins: taker loses each time, defender is never taker/partner
        for ($i = 0; $i < 10; ++$i) {
            $this->completeGame($session, $players[0], points: 30, takerScore: -100);
        }

        $result = $this->checker->checkAndAward($session);

        self::assertContains(BadgeType::Wall, $result[$defender->getId()]);
    }

    public function testWallBadgeNotAwardedUnder10(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();
        $defender = $players[1];

        // Only 9 consecutive defense wins
        for ($i = 0; $i < 9; ++$i) {
            $this->completeGame($session, $players[0], points: 30, takerScore: -100);
        }

        $result = $this->checker->checkAndAward($session);

        $defenderBadges = $result[$defender->getId()] ?? [];
        self::assertNotContains(BadgeType::Wall, $defenderBadges);
    }

    public function testWallBadgeStreakBrokenByTakerWin(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();
        $defender = $players[1];

        // 5 defense wins, then a taker win (breaks streak), then 5 more
        for ($i = 0; $i < 5; ++$i) {
            $this->completeGame($session, $players[0], points: 30, takerScore: -100);
        }
        $this->completeGame($session, $players[0], points: 56); // taker wins → defense loses
        for ($i = 0; $i < 5; ++$i) {
            $this->completeGame($session, $players[0], points: 30, takerScore: -100);
        }

        $result = $this->checker->checkAndAward($session);

        $defenderBadges = $result[$defender->getId()] ?? [];
        self::assertNotContains(BadgeType::Wall, $defenderBadges);
    }

    public function testFriendCallerBadge(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();
        $taker = $players[0];
        $partner = $players[1];

        // 5 consecutive games calling the same partner
        for ($i = 0; $i < 5; ++$i) {
            $this->completeGame($session, $taker, partner: $partner);
        }

        $result = $this->checker->checkAndAward($session);

        self::assertContains(BadgeType::FriendCaller, $result[$taker->getId()]);
    }

    public function testFriendCallerBadgeNotAwardedUnder5(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();
        $taker = $players[0];
        $partner = $players[1];

        // Only 4 consecutive games calling the same partner
        for ($i = 0; $i < 4; ++$i) {
            $this->completeGame($session, $taker, partner: $partner);
        }

        $result = $this->checker->checkAndAward($session);

        $takerBadges = $result[$taker->getId()] ?? [];
        self::assertNotContains(BadgeType::FriendCaller, $takerBadges);
    }

    public function testFriendCallerBadgeStreakBrokenByDifferentPartner(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();
        $taker = $players[0];
        $partnerA = $players[1];
        $partnerB = $players[2];

        // 3 with partnerA, 1 with partnerB, 3 with partnerA → max streak = 3
        for ($i = 0; $i < 3; ++$i) {
            $this->completeGame($session, $taker, partner: $partnerA);
        }
        $this->completeGame($session, $taker, partner: $partnerB);
        for ($i = 0; $i < 3; ++$i) {
            $this->completeGame($session, $taker, partner: $partnerA);
        }

        $result = $this->checker->checkAndAward($session);

        $takerBadges = $result[$taker->getId()] ?? [];
        self::assertNotContains(BadgeType::FriendCaller, $takerBadges);
    }

    public function testFriendCallerBadgeIgnoresSelfCalls(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();
        $taker = $players[0];

        // 5 self-calls (no partner) should NOT count
        for ($i = 0; $i < 5; ++$i) {
            $this->completeGame($session, $taker);
        }

        $result = $this->checker->checkAndAward($session);

        $takerBadges = $result[$taker->getId()] ?? [];
        self::assertNotContains(BadgeType::FriendCaller, $takerBadges);
    }

    public function testDestinyHandBadge(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $taker = $session->getPlayers()->toArray()[0];

        // 3 oudlers → required=36. Points=36 → margin=0, taker wins
        $this->completeGame($session, $taker, oudlers: 3, points: 36);

        $result = $this->checker->checkAndAward($session);

        self::assertContains(BadgeType::DestinyHand, $result[$taker->getId()]);
    }

    public function testDestinyHandBadgeNotAwardedOnLoss(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $taker = $session->getPlayers()->toArray()[0];

        // 3 oudlers → required=36. Points=35 → deficit=1, taker loses
        $this->completeGame($session, $taker, oudlers: 3, points: 35, takerScore: -50);

        $result = $this->checker->checkAndAward($session);

        $takerBadges = $result[$taker->getId()] ?? [];
        self::assertNotContains(BadgeType::DestinyHand, $takerBadges);
    }

    public function testDestinyHandBadgeNotAwardedWithMargin(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $taker = $session->getPlayers()->toArray()[0];

        // 3 oudlers → required=36. Points=37 → margin=1, not zero
        $this->completeGame($session, $taker, oudlers: 3, points: 37);

        $result = $this->checker->checkAndAward($session);

        $takerBadges = $result[$taker->getId()] ?? [];
        self::assertNotContains(BadgeType::DestinyHand, $takerBadges);
    }

    public function testDestinyHandBadgeWithDifferentOudlerCount(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $taker = $session->getPlayers()->toArray()[0];

        // 2 oudlers → required=41. Points=41.0 → margin=0
        $this->completeGame($session, $taker, oudlers: 2, points: 41);

        $result = $this->checker->checkAndAward($session);

        self::assertContains(BadgeType::DestinyHand, $result[$taker->getId()]);
    }

    public function testCatchThemAllBadge(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $player = $session->getPlayers()->toArray()[0];

        // Grant all badges except CatchThemAll manually
        foreach (BadgeType::cases() as $badgeType) {
            if (BadgeType::CatchThemAll === $badgeType) {
                continue;
            }
            $badge = new PlayerBadge();
            $badge->setBadgeType($badgeType);
            $badge->setPlayer($player);
            $this->em->persist($badge);
        }
        $this->em->flush();

        $this->completeGame($session, $player);

        $result = $this->checker->checkAndAward($session);

        self::assertContains(BadgeType::CatchThemAll, $result[$player->getId()]);
    }
}
