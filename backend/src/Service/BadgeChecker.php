<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Player;
use App\Entity\PlayerBadge;
use App\Entity\Session;
use App\Enum\BadgeType;
use App\Enum\Chelem;
use App\Enum\Contract;
use App\Enum\GameStatus;
use App\Enum\Side;
use Doctrine\ORM\EntityManagerInterface;

final class BadgeChecker
{
    public function __construct(
        private readonly EntityManagerInterface $em,
    ) {
    }

    /**
     * Check all players in a session, award missing badges, return newly awarded.
     *
     * @return array<int, list<BadgeType>> playerId => new badge types
     */
    public function checkAndAward(Session $session): array
    {
        $result = [];
        foreach ($session->getPlayers() as $player) {
            $newBadges = $this->checkAndAwardForPlayer($player);
            if (!empty($newBadges)) {
                /** @var int $playerId */
                $playerId = $player->getId();
                $result[$playerId] = $newBadges;
            }
        }

        if (!empty($result)) {
            $this->em->flush();
        }

        return $result;
    }

    /**
     * Check single player, award missing badges, return newly awarded.
     *
     * @return list<BadgeType>
     */
    public function checkAndAwardForPlayer(Player $player): array
    {
        $existingTypes = $this->getExistingBadgeTypes($player);
        $newBadges = [];

        foreach (BadgeType::cases() as $badgeType) {
            if (\in_array($badgeType, $existingTypes, true)) {
                continue;
            }

            if ($this->checkCondition($badgeType, $player)) {
                $badge = new PlayerBadge();
                $badge->setBadgeType($badgeType);
                $badge->setPlayer($player);
                $this->em->persist($badge);

                $newBadges[] = $badgeType;
            }
        }

        if (!empty($newBadges)) {
            $this->em->flush();
        }

        return $newBadges;
    }

    private function checkCondition(BadgeType $badgeType, Player $player): bool
    {
        return match ($badgeType) {
            BadgeType::Centurion => $this->checkCenturion($player),
            BadgeType::ChampionStreak => $this->checkChampionStreak($player),
            BadgeType::Comeback => $this->checkComeback($player),
            BadgeType::FirstChelem => $this->checkFirstChelem($player),
            BadgeType::FirstGame => $this->checkFirstGame($player),
            BadgeType::Kamikaze => $this->checkKamikaze($player),
            BadgeType::LastPlace => $this->checkLastPlace($player),
            BadgeType::Marathon => $this->checkMarathon($player),
            BadgeType::NightOwl => $this->checkNightOwl($player),
            BadgeType::NoNet => $this->checkNoNet($player),
            BadgeType::PetitMalin => $this->checkPetitMalin($player),
            BadgeType::Regular => $this->checkRegular($player),
            BadgeType::Social => $this->checkSocial($player),
            BadgeType::StarCollector => $this->checkStarCollector($player),
            BadgeType::Wall => $this->checkWall($player),
        };
    }

    /**
     * Player has >= 100 completed games.
     */
    private function checkCenturion(Player $player): bool
    {
        $count = (int) $this->em->createQuery(
            'SELECT COUNT(se.id) FROM App\Entity\ScoreEntry se
             JOIN se.game g
             WHERE se.player = :player AND g.status = :status'
        )
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->getSingleScalarResult();

        return $count >= 100;
    }

    /**
     * Player had >= 5 consecutive wins as taker.
     */
    private function checkChampionStreak(Player $player): bool
    {
        /** @var list<array{score: int}> $games */
        $games = $this->em->createQuery(
            'SELECT se.score FROM App\Entity\Game g
             JOIN g.scoreEntries se
             WHERE g.taker = :player AND g.status = :status AND se.player = :player
             ORDER BY g.createdAt ASC'
        )
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->getResult();

        return $this->maxStreak($games, static fn (array $game): bool => $game['score'] > 0) >= 5;
    }

    /**
     * Player was last at some point during a session and ended up first.
     */
    private function checkComeback(Player $player): bool
    {
        /** @var list<array{sessionId: int}> $sessions */
        $sessions = $this->em->createQuery(
            'SELECT DISTINCT IDENTITY(se.session) AS sessionId FROM App\Entity\ScoreEntry se
             JOIN se.game g
             WHERE se.player = :player AND g.status = :status'
        )
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->getResult();

        foreach ($sessions as $row) {
            if ($this->checkComebackInSession((int) $row['sessionId'], $player)) {
                return true;
            }
        }

        return false;
    }

    private function checkComebackInSession(int $sessionId, Player $player): bool
    {
        /** @var list<array{playerId: int, score: int, position: int}> $entries */
        $entries = $this->em->createQuery(
            'SELECT IDENTITY(se.player) AS playerId, se.score, g.position
             FROM App\Entity\ScoreEntry se
             JOIN se.game g
             WHERE g.session = :session AND g.status = :status
             ORDER BY g.position ASC'
        )
            ->setParameter('session', $sessionId)
            ->setParameter('status', GameStatus::Completed)
            ->getResult();

        if (0 === \count($entries)) {
            return false;
        }

        // Build cumulative scores per game position
        /** @var array<int, int> $cumulative */
        $cumulative = [];
        $wasLast = false;
        $currentPosition = 0;

        foreach ($entries as $entry) {
            $pid = (int) $entry['playerId'];
            $pos = (int) $entry['position'];

            if ($pos !== $currentPosition) {
                // New game: check if player is last after previous game
                if ($currentPosition > 0 && [] !== $cumulative) {
                    $minScore = \min($cumulative);
                    $playerScore = $cumulative[$player->getId()] ?? null;
                    if (null !== $playerScore && $playerScore === $minScore) {
                        // Check that player is strictly last (not tied)
                        $countAtMin = \count(\array_filter($cumulative, static fn (int $s): bool => $s === $minScore));
                        if (1 === $countAtMin) {
                            $wasLast = true;
                        }
                    }
                }
                $currentPosition = $pos;
            }

            $cumulative[$pid] = ($cumulative[$pid] ?? 0) + (int) $entry['score'];
        }

        // After last game: check if player finished first
        if (!$wasLast) {
            return false;
        }

        $maxScore = \max($cumulative);
        $playerScore = $cumulative[$player->getId()] ?? null;

        if (null === $playerScore || $playerScore !== $maxScore) {
            return false;
        }

        // Check strictly first
        $countAtMax = \count(\array_filter($cumulative, static fn (int $s): bool => $s === $maxScore));

        return 1 === $countAtMax;
    }

    /**
     * Player was taker in a game with chelem=AnnouncedWon.
     */
    private function checkFirstChelem(Player $player): bool
    {
        $count = (int) $this->em->createQuery(
            'SELECT COUNT(g.id) FROM App\Entity\Game g
             WHERE g.taker = :player AND g.status = :status AND g.chelem = :chelem'
        )
            ->setParameter('chelem', Chelem::AnnouncedWon)
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->getSingleScalarResult();

        return $count >= 1;
    }

    /**
     * Player has >= 1 completed game.
     */
    private function checkFirstGame(Player $player): bool
    {
        $count = (int) $this->em->createQuery(
            'SELECT COUNT(se.id) FROM App\Entity\ScoreEntry se
             JOIN se.game g
             WHERE se.player = :player AND g.status = :status'
        )
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->getSingleScalarResult();

        return $count >= 1;
    }

    /**
     * Player was taker in a GardeContre game.
     */
    private function checkKamikaze(Player $player): bool
    {
        $count = (int) $this->em->createQuery(
            'SELECT COUNT(g.id) FROM App\Entity\Game g
             WHERE g.taker = :player AND g.status = :status AND g.contract = :contract'
        )
            ->setParameter('contract', Contract::GardeContre)
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->getSingleScalarResult();

        return $count >= 1;
    }

    /**
     * Player finished last (lowest cumulative score) in >= 5 sessions.
     */
    private function checkLastPlace(Player $player): bool
    {
        /** @var list<array{sessionId: int}> $sessions */
        $sessions = $this->em->createQuery(
            'SELECT DISTINCT IDENTITY(se.session) AS sessionId FROM App\Entity\ScoreEntry se
             JOIN se.game g
             WHERE se.player = :player AND g.status = :status'
        )
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->getResult();

        $lastPlaceCount = 0;
        foreach ($sessions as $row) {
            if ($this->isLastInSession((int) $row['sessionId'], $player)) {
                ++$lastPlaceCount;
            }
        }

        return $lastPlaceCount >= 5;
    }

    private function isLastInSession(int $sessionId, Player $player): bool
    {
        /** @var list<array{playerId: int, totalScore: string}> $scores */
        $scores = $this->em->createQuery(
            'SELECT IDENTITY(se.player) AS playerId, SUM(se.score) AS totalScore
             FROM App\Entity\ScoreEntry se
             JOIN se.game g
             WHERE g.session = :session AND g.status = :status
             GROUP BY se.player
             ORDER BY totalScore ASC'
        )
            ->setParameter('session', $sessionId)
            ->setParameter('status', GameStatus::Completed)
            ->getResult();

        if (0 === \count($scores)) {
            return false;
        }

        return (int) $scores[0]['playerId'] === $player->getId();
    }

    /**
     * Player was in a session lasting > 3 hours.
     */
    private function checkMarathon(Player $player): bool
    {
        /** @var list<array{sessionId: int, maxDuration: string}> $sessions */
        $sessions = $this->em->createQuery(
            'SELECT IDENTITY(g.session) AS sessionId, MAX(TIMESTAMPDIFF(SECOND, s.createdAt, g.completedAt)) AS maxDuration
             FROM App\Entity\Game g
             JOIN g.session s
             JOIN s.players p
             WHERE p = :player AND g.status = :status
             AND g.completedAt IS NOT NULL
             GROUP BY g.session
             HAVING MAX(TIMESTAMPDIFF(SECOND, s.createdAt, g.completedAt)) > :threshold'
        )
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->setParameter('threshold', 3 * 3600)
            ->getResult();

        return \count($sessions) >= 1;
    }

    /**
     * Player participated in a game completed between 00:00-04:59.
     */
    private function checkNightOwl(Player $player): bool
    {
        $count = (int) $this->em->createQuery(
            'SELECT COUNT(se.id) FROM App\Entity\ScoreEntry se
             JOIN se.game g
             WHERE se.player = :player AND g.status = :status
             AND g.completedAt IS NOT NULL
             AND HOUR(g.completedAt) >= 0 AND HOUR(g.completedAt) < 5'
        )
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->getSingleScalarResult();

        return $count >= 1;
    }

    /**
     * Player was taker in a GardeSans game AND won (taker's score > 0).
     */
    private function checkNoNet(Player $player): bool
    {
        $count = (int) $this->em->createQuery(
            'SELECT COUNT(g.id) FROM App\Entity\Game g
             JOIN g.scoreEntries se
             WHERE g.taker = :player AND g.status = :status
             AND g.contract = :contract
             AND se.player = :player AND se.score > 0'
        )
            ->setParameter('contract', Contract::GardeSans)
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->getSingleScalarResult();

        return $count >= 1;
    }

    /**
     * Player was taker in >= 5 games with petitAuBout=Attack AND taker won (score > 0).
     */
    private function checkPetitMalin(Player $player): bool
    {
        $count = (int) $this->em->createQuery(
            'SELECT COUNT(g.id) FROM App\Entity\Game g
             JOIN g.scoreEntries se
             WHERE g.taker = :player AND g.status = :status
             AND g.petitAuBout = :petitAuBout
             AND se.player = :player AND se.score > 0'
        )
            ->setParameter('petitAuBout', Side::Attack)
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->getSingleScalarResult();

        return $count >= 5;
    }

    /**
     * Player participated in >= 10 distinct sessions with completed games.
     */
    private function checkRegular(Player $player): bool
    {
        $count = (int) $this->em->createQuery(
            'SELECT COUNT(DISTINCT g.session) FROM App\Entity\ScoreEntry se
             JOIN se.game g
             WHERE se.player = :player AND g.status = :status'
        )
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->getSingleScalarResult();

        return $count >= 10;
    }

    /**
     * Player played with >= 10 distinct other players (in sessions with completed games).
     */
    private function checkSocial(Player $player): bool
    {
        $count = (int) $this->em->createQuery(
            'SELECT COUNT(DISTINCT p2.id) FROM App\Entity\Session s
             JOIN s.players p
             JOIN s.players p2
             JOIN s.games g
             WHERE p = :player AND p2 != :player AND g.status = :status'
        )
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->getSingleScalarResult();

        return $count >= 10;
    }

    /**
     * Player has >= 10 StarEvents.
     */
    private function checkStarCollector(Player $player): bool
    {
        $count = (int) $this->em->createQuery(
            'SELECT COUNT(se.id) FROM App\Entity\StarEvent se
             WHERE se.player = :player'
        )
            ->setParameter('player', $player)
            ->getSingleScalarResult();

        return $count >= 10;
    }

    /**
     * Player had >= 10 consecutive defense wins.
     * Defense win = game where player was NOT taker AND NOT partner, and taker's score < 0.
     */
    private function checkWall(Player $player): bool
    {
        // Fetch all games where player participated, ordered by createdAt
        /** @var list<array{gameId: int, partnerId: int|null, takerId: int, takerScore: int}> $games */
        $games = $this->em->createQuery(
            'SELECT g.id AS gameId, IDENTITY(g.taker) AS takerId, IDENTITY(g.partner) AS partnerId, se2.score AS takerScore
             FROM App\Entity\ScoreEntry se
             JOIN se.game g
             JOIN g.scoreEntries se2
             WHERE se.player = :player AND g.status = :status
             AND se2.player = g.taker
             ORDER BY g.createdAt ASC'
        )
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->getResult();

        $playerId = $player->getId();
        $max = 0;
        $current = 0;

        foreach ($games as $game) {
            $isDefense = $game['takerId'] !== $playerId
                && (null === $game['partnerId'] || $game['partnerId'] !== $playerId);
            $defenseWin = $isDefense && $game['takerScore'] < 0;

            if ($defenseWin) {
                ++$current;
                $max = \max($max, $current);
            } else {
                $current = 0;
            }
        }

        return $max >= 10;
    }

    /**
     * @return list<BadgeType>
     */
    private function getExistingBadgeTypes(Player $player): array
    {
        /** @var list<array{badgeType: BadgeType}> $rows */
        $rows = $this->em->createQuery(
            'SELECT pb.badgeType FROM App\Entity\PlayerBadge pb WHERE pb.player = :player'
        )
            ->setParameter('player', $player)
            ->getResult();

        return \array_map(static fn (array $row): BadgeType => $row['badgeType'], $rows);
    }

    /**
     * Compute the max consecutive streak matching a condition.
     *
     * @param list<array<string, mixed>>           $items
     * @param callable(array<string, mixed>): bool $condition
     */
    private function maxStreak(array $items, callable $condition): int
    {
        $max = 0;
        $current = 0;

        foreach ($items as $item) {
            if ($condition($item)) {
                ++$current;
                $max = \max($max, $current);
            } else {
                $current = 0;
            }
        }

        return $max;
    }
}
