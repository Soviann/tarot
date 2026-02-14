<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Player;
use App\Entity\PlayerBadge;
use App\Entity\Session;
use App\Enum\BadgeType;
use App\Enum\Chelem;
use App\Enum\Contract;
use App\Enum\Side;
use App\Repository\GameRepository;
use App\Repository\PlayerBadgeRepository;
use App\Repository\ScoreEntryRepository;
use App\Repository\SessionRepository;
use App\Repository\StarEventRepository;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Vérifie et attribue les badges (succès / achievements) aux joueurs.
 *
 * Appelé automatiquement après chaque donne complétée (via GameCompleteProcessor)
 * pour vérifier si de nouveaux badges ont été débloqués par les joueurs de la session.
 *
 * Chaque badge est défini dans l'enum BadgeType et sa condition est évaluée
 * par une méthode privée check*() dédiée. Un badge déjà obtenu n'est jamais
 * réévalué (filtrage via getExistingBadgeTypes).
 *
 * @see BadgeType pour la liste complète des badges et leurs descriptions
 */
final readonly class BadgeChecker
{
    public function __construct(
        private EntityManagerInterface $em,
        private GameRepository $gameRepository,
        private PlayerBadgeRepository $playerBadgeRepository,
        private ScoreEntryRepository $scoreEntryRepository,
        private SessionRepository $sessionRepository,
        private StarEventRepository $starEventRepository,
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
            $awarded = $this->checkAndAwardForPlayer($player, flush: false);
            if (!empty($awarded)) {
                /** @var int $playerId */
                $playerId = $player->getId();
                $result[$playerId] = $awarded;
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
    public function checkAndAwardForPlayer(Player $player, bool $flush = true): array
    {
        $existingTypes = $this->playerBadgeRepository->getExistingBadgeTypesForPlayer($player);
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

        if ($flush && !empty($newBadges)) {
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
        return $this->scoreEntryRepository->countCompletedGameEntriesForPlayer($player) >= 100;
    }

    /**
     * Player had >= 5 consecutive wins as taker.
     */
    private function checkChampionStreak(Player $player): bool
    {
        $scores = $this->gameRepository->getTakerScoresForPlayer($player);
        $games = \array_map(static fn (int $score): array => ['score' => $score], $scores);

        return $this->maxStreak($games, static fn (array $game): bool => $game['score'] > 0) >= 5;
    }

    /**
     * Player was last at some point during a session and ended up first.
     */
    private function checkComeback(Player $player): bool
    {
        $sessionIds = $this->scoreEntryRepository->getDistinctCompletedSessionIdsForPlayer($player);

        foreach ($sessionIds as $sessionId) {
            if ($this->checkComebackInSession($sessionId, $player)) {
                return true;
            }
        }

        return false;
    }

    private function checkComebackInSession(int $sessionId, Player $player): bool
    {
        $entries = $this->scoreEntryRepository->getEntriesForSessionByPosition($sessionId);

        if (0 === \count($entries)) {
            return false;
        }

        // Build cumulative scores per game position
        /** @var array<int, int> $cumulative */
        $cumulative = [];
        $wasLast = false;
        $currentPosition = 0;

        foreach ($entries as $entry) {
            $pid = $entry->playerId;
            $pos = $entry->position;

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

            $cumulative[$pid] = ($cumulative[$pid] ?? 0) + $entry->score;
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
        return $this->gameRepository->countByTakerAndStatusAndChelem($player, Chelem::AnnouncedWon) >= 1;
    }

    /**
     * Player has >= 1 completed game.
     */
    private function checkFirstGame(Player $player): bool
    {
        return $this->scoreEntryRepository->countCompletedGameEntriesForPlayer($player) >= 1;
    }

    /**
     * Player was taker in a GardeContre game.
     */
    private function checkKamikaze(Player $player): bool
    {
        return $this->gameRepository->countByTakerAndStatusAndContract($player, Contract::GardeContre) >= 1;
    }

    /**
     * Player finished last (lowest cumulative score) in >= 5 sessions.
     */
    private function checkLastPlace(Player $player): bool
    {
        $sessionIds = $this->scoreEntryRepository->getDistinctCompletedSessionIdsForPlayer($player);

        $lastPlaceCount = 0;
        foreach ($sessionIds as $sessionId) {
            if ($this->isLastInSession($sessionId, $player)) {
                ++$lastPlaceCount;
            }
        }

        return $lastPlaceCount >= 5;
    }

    private function isLastInSession(int $sessionId, Player $player): bool
    {
        $scores = $this->scoreEntryRepository->getScoreSumsByPlayerForSession($sessionId);

        if (0 === \count($scores)) {
            return false;
        }

        return $scores[0]->playerId === $player->getId();
    }

    /**
     * Player was in a session lasting > 3 hours.
     */
    private function checkMarathon(Player $player): bool
    {
        $sessions = $this->gameRepository->getMarathonSessionsForPlayer($player, 3 * 3600);

        return \count($sessions) >= 1;
    }

    /**
     * Player participated in a game completed between 00:00-04:59.
     */
    private function checkNightOwl(Player $player): bool
    {
        return $this->scoreEntryRepository->countNightOwlGamesForPlayer($player) >= 1;
    }

    /**
     * Player was taker in a GardeSans game AND won (taker's score > 0).
     */
    private function checkNoNet(Player $player): bool
    {
        return $this->gameRepository->countWonGamesWithContract($player, Contract::GardeSans) >= 1;
    }

    /**
     * Player was taker in >= 5 games with petitAuBout=Attack AND taker won (score > 0).
     */
    private function checkPetitMalin(Player $player): bool
    {
        return $this->gameRepository->countWonGamesWithPetitAuBout($player, Side::Attack) >= 5;
    }

    /**
     * Player participated in >= 10 distinct sessions with completed games.
     */
    private function checkRegular(Player $player): bool
    {
        return $this->scoreEntryRepository->countDistinctCompletedSessionsForPlayer($player) >= 10;
    }

    /**
     * Player played with >= 10 distinct other players (in sessions with completed games).
     */
    private function checkSocial(Player $player): bool
    {
        return $this->sessionRepository->countDistinctCoPlayersForPlayer($player) >= 10;
    }

    /**
     * Player has >= 10 StarEvents.
     */
    private function checkStarCollector(Player $player): bool
    {
        return $this->starEventRepository->countByPlayer($player) >= 10;
    }

    /**
     * Player had >= 10 consecutive defense wins.
     * Defense win = game where player was NOT taker AND NOT partner, and taker's score < 0.
     */
    private function checkWall(Player $player): bool
    {
        $games = $this->scoreEntryRepository->getGamesWithTakerScoreForPlayer($player);

        $playerId = $player->getId();
        $max = 0;
        $current = 0;

        foreach ($games as $game) {
            $isDefense = $game->takerId !== $playerId
                && (null === $game->partnerId || $game->partnerId !== $playerId);
            $defenseWin = $isDefense && $game->takerScore < 0;

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
