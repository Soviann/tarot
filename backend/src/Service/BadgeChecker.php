<?php

declare(strict_types=1);

namespace App\Service;

use App\Dto\PlayerScoreSumDto;
use App\Dto\ScoreEntryPositionDto;
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
 * Les données nécessaires aux vérifications sont pré-chargées en batch via
 * buildContexts() pour éviter les requêtes N+1.
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
        $players = $session->getPlayers()->toArray();
        /** @var list<int> $playerIds */
        $playerIds = \array_map(static fn (Player $p): int => (int) $p->getId(), $players);

        $existingBadges = $this->playerBadgeRepository->getExistingBadgeTypesForPlayers($playerIds);
        $contexts = $this->buildContexts($playerIds);

        // Pre-fetch session data for Comeback and LastPlace checks
        // Collect all unique session IDs across all players
        $allSessionIds = [];
        foreach ($contexts as $ctx) {
            foreach ($ctx->distinctSessionIds as $sid) {
                $allSessionIds[$sid] = true;
            }
        }
        /** @var list<int> $allSessionIdList */
        $allSessionIdList = \array_keys($allSessionIds);

        // Fetch session entries and score sums once per session (shared across players)
        $sessionEntries = [];
        $sessionScoreSums = [];
        foreach ($allSessionIdList as $sessionId) {
            $sessionEntries[$sessionId] = $this->scoreEntryRepository->getEntriesForSessionByPosition($sessionId);
            $sessionScoreSums[$sessionId] = $this->scoreEntryRepository->getScoreSumsByPlayerForSession($sessionId);
        }

        $result = [];
        foreach ($players as $player) {
            /** @var int $playerId */
            $playerId = $player->getId();
            $existing = $existingBadges[$playerId] ?? [];
            $context = $contexts[$playerId];
            $newBadges = [];

            foreach (BadgeType::cases() as $badgeType) {
                if (\in_array($badgeType, $existing, true)) {
                    continue;
                }
                if ($this->checkCondition($badgeType, $player, $context, $sessionEntries, $sessionScoreSums)) {
                    $badge = new PlayerBadge();
                    $badge->setBadgeType($badgeType);
                    $badge->setPlayer($player);
                    $this->em->persist($badge);
                    $newBadges[] = $badgeType;
                }
            }

            if ([] !== $newBadges) {
                $result[$playerId] = $newBadges;
            }
        }

        if ([] !== $result) {
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
        /** @var int $playerId */
        $playerId = $player->getId();
        $existingTypes = $this->playerBadgeRepository->getExistingBadgeTypesForPlayer($player);
        $contexts = $this->buildContexts([$playerId]);
        $context = $contexts[$playerId];

        // Pre-fetch session data for this player
        $sessionEntries = [];
        $sessionScoreSums = [];
        foreach ($context->distinctSessionIds as $sessionId) {
            $sessionEntries[$sessionId] = $this->scoreEntryRepository->getEntriesForSessionByPosition($sessionId);
            $sessionScoreSums[$sessionId] = $this->scoreEntryRepository->getScoreSumsByPlayerForSession($sessionId);
        }

        $newBadges = [];
        foreach (BadgeType::cases() as $badgeType) {
            if (\in_array($badgeType, $existingTypes, true)) {
                continue;
            }
            if ($this->checkCondition($badgeType, $player, $context, $sessionEntries, $sessionScoreSums)) {
                $badge = new PlayerBadge();
                $badge->setBadgeType($badgeType);
                $badge->setPlayer($player);
                $this->em->persist($badge);
                $newBadges[] = $badgeType;
            }
        }

        if ($flush && [] !== $newBadges) {
            $this->em->flush();
        }

        return $newBadges;
    }

    /**
     * Build a BadgeCheckContext for each player by batch-fetching all required data.
     *
     * @param list<int> $playerIds
     *
     * @return array<int, BadgeCheckContext>
     */
    private function buildContexts(array $playerIds): array
    {
        $chelemCounts = $this->gameRepository->countByTakerAndChelemForPlayers($playerIds, Chelem::AnnouncedWon);
        $completedCounts = $this->scoreEntryRepository->countCompletedGameEntriesForPlayers($playerIds);
        $coPlayerCounts = $this->sessionRepository->countDistinctCoPlayersForPlayers($playerIds);
        $distinctSessionCounts = $this->scoreEntryRepository->countDistinctCompletedSessionsForPlayers($playerIds);
        $distinctSessionIds = $this->scoreEntryRepository->getDistinctCompletedSessionIdsForPlayers($playerIds);
        $gardeContreCounts = $this->gameRepository->countByTakerAndContractForPlayers($playerIds, Contract::GardeContre);
        $gamesWithTakerScore = $this->scoreEntryRepository->getGamesWithTakerScoreForPlayers($playerIds);
        $marathonSessionIds = $this->gameRepository->getMarathonSessionsForPlayers($playerIds, 3 * 3600);
        $nightOwlCounts = $this->scoreEntryRepository->countNightOwlGamesForPlayers($playerIds);
        $starEventCounts = $this->starEventRepository->countByPlayers($playerIds);
        $takerScores = $this->gameRepository->getTakerScoresForPlayers($playerIds);
        $wonGardeSansCounts = $this->gameRepository->countWonGamesWithContractForPlayers($playerIds, Contract::GardeSans);
        $wonPetitAuBoutAttackCounts = $this->gameRepository->countWonGamesWithPetitAuBoutForPlayers($playerIds, Side::Attack);

        $contexts = [];
        foreach ($playerIds as $playerId) {
            $contexts[$playerId] = new BadgeCheckContext(
                chelemAnnouncedWonCount: $chelemCounts[$playerId] ?? 0,
                coPlayerCount: $coPlayerCounts[$playerId] ?? 0,
                completedGameCount: $completedCounts[$playerId] ?? 0,
                distinctSessionIds: $distinctSessionIds[$playerId] ?? [],
                distinctSessionCount: $distinctSessionCounts[$playerId] ?? 0,
                gardeContreCount: $gardeContreCounts[$playerId] ?? 0,
                gamesWithTakerScore: $gamesWithTakerScore[$playerId] ?? [],
                marathonSessionIds: $marathonSessionIds[$playerId] ?? [],
                nightOwlCount: $nightOwlCounts[$playerId] ?? 0,
                starEventCount: $starEventCounts[$playerId] ?? 0,
                takerScores: $takerScores[$playerId] ?? [],
                wonGardeSansCount: $wonGardeSansCounts[$playerId] ?? 0,
                wonPetitAuBoutAttackCount: $wonPetitAuBoutAttackCounts[$playerId] ?? 0,
            );
        }

        return $contexts;
    }

    /**
     * @param array<int, list<ScoreEntryPositionDto>> $sessionEntries
     * @param array<int, list<PlayerScoreSumDto>>     $sessionScoreSums
     */
    private function checkCondition(
        BadgeType $badgeType,
        Player $player,
        BadgeCheckContext $context,
        array $sessionEntries,
        array $sessionScoreSums,
    ): bool {
        return match ($badgeType) {
            BadgeType::Centurion => $this->checkCenturion($context),
            BadgeType::ChampionStreak => $this->checkChampionStreak($context),
            BadgeType::Comeback => $this->checkComeback($player, $context, $sessionEntries),
            BadgeType::FirstChelem => $this->checkFirstChelem($context),
            BadgeType::FirstGame => $this->checkFirstGame($context),
            BadgeType::Kamikaze => $this->checkKamikaze($context),
            BadgeType::LastPlace => $this->checkLastPlace($player, $context, $sessionScoreSums),
            BadgeType::Marathon => $this->checkMarathon($context),
            BadgeType::NightOwl => $this->checkNightOwl($context),
            BadgeType::NoNet => $this->checkNoNet($context),
            BadgeType::PetitMalin => $this->checkPetitMalin($context),
            BadgeType::Regular => $this->checkRegular($context),
            BadgeType::Social => $this->checkSocial($context),
            BadgeType::StarCollector => $this->checkStarCollector($context),
            BadgeType::Wall => $this->checkWall($player, $context),
        };
    }

    /**
     * Player has >= 100 completed games.
     */
    private function checkCenturion(BadgeCheckContext $context): bool
    {
        return $context->completedGameCount >= 100;
    }

    /**
     * Player had >= 5 consecutive wins as taker.
     */
    private function checkChampionStreak(BadgeCheckContext $context): bool
    {
        $games = \array_map(static fn (int $score): array => ['score' => $score], $context->takerScores);

        return $this->maxStreak($games, static fn (array $game): bool => $game['score'] > 0) >= 5;
    }

    /**
     * Player was last at some point during a session and ended up first.
     *
     * @param array<int, list<ScoreEntryPositionDto>> $sessionEntries
     */
    private function checkComeback(Player $player, BadgeCheckContext $context, array $sessionEntries): bool
    {
        foreach ($context->distinctSessionIds as $sessionId) {
            if ($this->checkComebackInSession($sessionEntries[$sessionId] ?? [], $player)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param list<ScoreEntryPositionDto> $entries
     */
    private function checkComebackInSession(array $entries, Player $player): bool
    {
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
    private function checkFirstChelem(BadgeCheckContext $context): bool
    {
        return $context->chelemAnnouncedWonCount >= 1;
    }

    /**
     * Player has >= 1 completed game.
     */
    private function checkFirstGame(BadgeCheckContext $context): bool
    {
        return $context->completedGameCount >= 1;
    }

    /**
     * Player was taker in a GardeContre game.
     */
    private function checkKamikaze(BadgeCheckContext $context): bool
    {
        return $context->gardeContreCount >= 1;
    }

    /**
     * Player finished last (lowest cumulative score) in >= 5 sessions.
     *
     * @param array<int, list<PlayerScoreSumDto>> $sessionScoreSums
     */
    private function checkLastPlace(Player $player, BadgeCheckContext $context, array $sessionScoreSums): bool
    {
        $lastPlaceCount = 0;
        foreach ($context->distinctSessionIds as $sessionId) {
            if ($this->isLastInSession($sessionScoreSums[$sessionId] ?? [], $player)) {
                ++$lastPlaceCount;
            }
        }

        return $lastPlaceCount >= 5;
    }

    /**
     * @param list<PlayerScoreSumDto> $scores
     */
    private function isLastInSession(array $scores, Player $player): bool
    {
        if (0 === \count($scores)) {
            return false;
        }

        return $scores[0]->playerId === $player->getId();
    }

    /**
     * Player was in a session lasting > 3 hours.
     */
    private function checkMarathon(BadgeCheckContext $context): bool
    {
        return \count($context->marathonSessionIds) >= 1;
    }

    /**
     * Player participated in a game completed between 00:00-04:59.
     */
    private function checkNightOwl(BadgeCheckContext $context): bool
    {
        return $context->nightOwlCount >= 1;
    }

    /**
     * Player was taker in a GardeSans game AND won (taker's score > 0).
     */
    private function checkNoNet(BadgeCheckContext $context): bool
    {
        return $context->wonGardeSansCount >= 1;
    }

    /**
     * Player was taker in >= 5 games with petitAuBout=Attack AND taker won (score > 0).
     */
    private function checkPetitMalin(BadgeCheckContext $context): bool
    {
        return $context->wonPetitAuBoutAttackCount >= 5;
    }

    /**
     * Player participated in >= 10 distinct sessions with completed games.
     */
    private function checkRegular(BadgeCheckContext $context): bool
    {
        return $context->distinctSessionCount >= 10;
    }

    /**
     * Player played with >= 10 distinct other players (in sessions with completed games).
     */
    private function checkSocial(BadgeCheckContext $context): bool
    {
        return $context->coPlayerCount >= 10;
    }

    /**
     * Player has >= 10 StarEvents.
     */
    private function checkStarCollector(BadgeCheckContext $context): bool
    {
        return $context->starEventCount >= 10;
    }

    /**
     * Player had >= 10 consecutive defense wins.
     * Defense win = game where player was NOT taker AND NOT partner, and taker's score < 0.
     */
    private function checkWall(Player $player, BadgeCheckContext $context): bool
    {
        $playerId = $player->getId();
        $max = 0;
        $current = 0;

        foreach ($context->gamesWithTakerScore as $game) {
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
