<?php

declare(strict_types=1);

namespace App\Service;

use App\Dto\GameTakerScoreDto;
use App\Dto\PlayerScoreSumDto;
use App\Dto\ScoreEntryPositionDto;
use App\Entity\Player;
use App\Entity\PlayerBadge;
use App\Entity\Session;
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
use App\Service\Scoring\ScoreCalculator;
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
    private const int MARATHON_THRESHOLD_SECONDS = 3 * 3600;

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

        $allSessionIds = [];
        foreach ($contexts as $ctx) {
            foreach ($ctx->distinctSessionIds as $sid) {
                $allSessionIds[$sid] = true;
            }
        }
        /** @var list<int> $allSessionIdList */
        $allSessionIdList = \array_keys($allSessionIds);

        $sessionEntries = $this->scoreEntryRepository->getEntriesForSessionsByPosition($allSessionIdList);
        $sessionScoreSums = $this->scoreEntryRepository->getScoreSumsByPlayerForSessions($allSessionIdList);

        $result = [];
        foreach ($players as $player) {
            /** @var int $playerId */
            $playerId = $player->getId();
            $newBadges = $this->awardBadgesForPlayer(
                $player,
                $existingBadges[$playerId] ?? [],
                $contexts[$playerId],
                $sessionEntries,
                $sessionScoreSums,
            );

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

        $sessionEntries = $this->scoreEntryRepository->getEntriesForSessionsByPosition($context->distinctSessionIds);
        $sessionScoreSums = $this->scoreEntryRepository->getScoreSumsByPlayerForSessions($context->distinctSessionIds);

        $newBadges = $this->awardBadgesForPlayer($player, $existingTypes, $context, $sessionEntries, $sessionScoreSums);

        if ($flush && [] !== $newBadges) {
            $this->em->flush();
        }

        return $newBadges;
    }

    /**
     * @param list<BadgeType>                         $existingTypes
     * @param array<int, list<ScoreEntryPositionDto>> $sessionEntries
     * @param array<int, list<PlayerScoreSumDto>>     $sessionScoreSums
     *
     * @return list<BadgeType> newly awarded badge types
     */
    private function awardBadgesForPlayer(
        Player $player,
        array $existingTypes,
        BadgeCheckContext $context,
        array $sessionEntries,
        array $sessionScoreSums,
    ): array {
        $newBadges = [];

        foreach (BadgeType::cases() as $badgeType) {
            if (BadgeType::CatchThemAll === $badgeType || BadgeType::Konami === $badgeType) {
                continue;
            }
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

        if (!\in_array(BadgeType::CatchThemAll, $existingTypes, true)) {
            $allTypes = \array_merge($existingTypes, $newBadges);
            if ($this->checkCatchThemAll($allTypes)) {
                $badge = new PlayerBadge();
                $badge->setBadgeType(BadgeType::CatchThemAll);
                $badge->setPlayer($player);
                $this->em->persist($badge);
                $newBadges[] = BadgeType::CatchThemAll;
            }
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
        $announcedChelemCounts = $this->gameRepository->countByTakerAndAnnouncedChelemForPlayers($playerIds, [Chelem::AnnouncedWon, Chelem::AnnouncedLost]);
        $chelemCounts = $this->gameRepository->countByTakerAndChelemForPlayers($playerIds, Chelem::AnnouncedWon);
        $completedCounts = $this->scoreEntryRepository->countCompletedGameEntriesForPlayers($playerIds);
        $coPlayerCounts = $this->sessionRepository->countDistinctCoPlayersForPlayers($playerIds);
        $distinctSessionCounts = $this->scoreEntryRepository->countDistinctCompletedSessionsForPlayers($playerIds);
        $distinctSessionIds = $this->scoreEntryRepository->getDistinctCompletedSessionIdsForPlayers($playerIds);
        $gardeContreCounts = $this->gameRepository->countByTakerAndContractForPlayers($playerIds, Contract::GardeContre);
        $gamesWithTakerScore = $this->scoreEntryRepository->getGamesWithTakerScoreForPlayers($playerIds);
        $hasStarShower = $this->starEventRepository->hasStarShowerForPlayers($playerIds);
        $marathonSessionIds = $this->gameRepository->getMarathonSessionsForPlayers($playerIds, self::MARATHON_THRESHOLD_SECONDS);
        $nightOwlCounts = $this->scoreEntryRepository->countNightOwlGamesForPlayers($playerIds);
        $starEventCounts = $this->starEventRepository->countByPlayers($playerIds);
        $surpriseChelemCounts = $this->gameRepository->countSurpriseChelemForPlayers($playerIds);
        $takerGameDetails = $this->gameRepository->getTakerGameDetailsForPlayers($playerIds);
        $takerScores = $this->gameRepository->getTakerScoresForPlayers($playerIds);
        $wonGardeContreCounts = $this->gameRepository->countWonGamesWithContractForPlayers($playerIds, Contract::GardeContre);
        $wonGardeSansCounts = $this->gameRepository->countWonGamesWithContractForPlayers($playerIds, Contract::GardeSans);
        $wonPetitAuBoutAttackCounts = $this->gameRepository->countWonGamesWithPetitAuBoutForPlayers($playerIds, Side::Attack);

        $contexts = [];
        foreach ($playerIds as $playerId) {
            $contexts[$playerId] = new BadgeCheckContext(
                announcedChelemCount: $announcedChelemCounts[$playerId] ?? 0,
                chelemAnnouncedWonCount: $chelemCounts[$playerId] ?? 0,
                coPlayerCount: $coPlayerCounts[$playerId] ?? 0,
                completedGameCount: $completedCounts[$playerId] ?? 0,
                distinctSessionIds: $distinctSessionIds[$playerId] ?? [],
                distinctSessionCount: $distinctSessionCounts[$playerId] ?? 0,
                gardeContreCount: $gardeContreCounts[$playerId] ?? 0,
                gamesWithTakerScore: $gamesWithTakerScore[$playerId] ?? [],
                hasStarShower: $hasStarShower[$playerId] ?? false,
                marathonSessionIds: $marathonSessionIds[$playerId] ?? [],
                nightOwlCount: $nightOwlCounts[$playerId] ?? 0,
                starEventCount: $starEventCounts[$playerId] ?? 0,
                surpriseChelemCount: $surpriseChelemCounts[$playerId] ?? 0,
                takerGameDetails: $takerGameDetails[$playerId] ?? [],
                takerScores: $takerScores[$playerId] ?? [],
                wonGardeContreCount: $wonGardeContreCounts[$playerId] ?? 0,
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
            BadgeType::Audacious => $this->checkAudacious($context),
            BadgeType::CatchThemAll, BadgeType::Konami => false,
            BadgeType::Centurion => $this->checkCenturion($context),
            BadgeType::ChampionStreak => $this->checkChampionStreak($context),
            BadgeType::CloseCall => $this->checkCloseCall($context),
            BadgeType::Comfortable10 => $this->checkComfortable($context, 10),
            BadgeType::Comfortable20 => $this->checkComfortable($context, 20),
            BadgeType::Comfortable30 => $this->checkComfortable($context, 30),
            BadgeType::Comfortable40 => $this->checkComfortable($context, 40),
            BadgeType::Comfortable50 => $this->checkComfortable($context, 50),
            BadgeType::Comeback => $this->checkComeback($player, $context, $sessionEntries),
            BadgeType::DestinyHand => $this->checkDestinyHand($context),
            BadgeType::FirstChelem => $this->checkFirstChelem($context),
            BadgeType::FirstGame => $this->checkFirstGame($context),
            BadgeType::FriendCaller => $this->checkFriendCaller($context),
            BadgeType::GardeContreWon => $this->checkGardeContreWon($context),
            BadgeType::Kamikaze => $this->checkKamikaze($context),
            BadgeType::LastPlace => $this->checkLastPlace($player, $context, $sessionScoreSums),
            BadgeType::LosingStreak => $this->checkLosingStreak($context),
            BadgeType::Marathon => $this->checkMarathon($context),
            BadgeType::NightOwl => $this->checkNightOwl($context),
            BadgeType::NoNet => $this->checkNoNet($context),
            BadgeType::PetitMalin => $this->checkPetitMalin($context),
            BadgeType::Regular => $this->checkRegular($context),
            BadgeType::RisingStar => $this->checkRisingStar($context),
            BadgeType::SelfCaller => $this->checkSelfCaller($context),
            BadgeType::Social => $this->checkSocial($context),
            BadgeType::StarCollector => $this->checkStarCollector($context),
            BadgeType::StarShower => $this->checkStarShower($context),
            BadgeType::SurpriseChelem => $this->checkSurpriseChelem($context),
            BadgeType::ThreeOutlersLoss => $this->checkThreeOutlersLoss($context),
            BadgeType::TriplePoignee => $this->checkTriplePoignee($player, $context),
            BadgeType::Wall => $this->checkWall($player, $context),
            BadgeType::ZeroBout => $this->checkZeroBout($context),
        };
    }

    /**
     * Player attempted an announced chelem (won or lost).
     */
    private function checkAudacious(BadgeCheckContext $context): bool
    {
        return $context->announcedChelemCount >= 1;
    }

    /**
     * Player has all other badges except CatchThemAll.
     *
     * @param list<BadgeType> $allTypes
     */
    private function checkCatchThemAll(array $allTypes): bool
    {
        foreach (BadgeType::cases() as $badgeType) {
            if (BadgeType::CatchThemAll === $badgeType) {
                continue;
            }
            if (!\in_array($badgeType, $allTypes, true)) {
                return false;
            }
        }

        return true;
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
        return $this->maxStreak($context->takerScores, static fn (int $score): bool => $score > 0) >= 5;
    }

    /**
     * Taker lost by less than 2 points of the required contract.
     */
    private function checkCloseCall(BadgeCheckContext $context): bool
    {
        foreach ($context->takerGameDetails as $game) {
            if ($game->takerScore >= 0) {
                continue;
            }
            $required = ScoreCalculator::REQUIRED_POINTS[$game->oudlers] ?? null;
            if (null === $required) {
                continue;
            }
            $deficit = $required - $game->points;
            if ($deficit > 0 && $deficit < 2) {
                return true;
            }
        }

        return false;
    }

    /**
     * Taker won by more than $threshold points above required.
     */
    private function checkComfortable(BadgeCheckContext $context, int $threshold): bool
    {
        foreach ($context->takerGameDetails as $game) {
            if ($game->takerScore <= 0) {
                continue;
            }
            $required = ScoreCalculator::REQUIRED_POINTS[$game->oudlers] ?? null;
            if (null === $required) {
                continue;
            }
            if (($game->points - $required) > $threshold) {
                return true;
            }
        }

        return false;
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
     * Taker won with exactly 0 margin (points === required for the number of oudlers).
     */
    private function checkDestinyHand(BadgeCheckContext $context): bool
    {
        foreach ($context->takerGameDetails as $game) {
            if ($game->takerScore <= 0) {
                continue;
            }
            $required = ScoreCalculator::REQUIRED_POINTS[$game->oudlers] ?? null;
            if (null === $required) {
                continue;
            }
            if ($game->points === (float) $required) {
                return true;
            }
        }

        return false;
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
     * Player called the same partner >= 5 consecutive times as taker.
     */
    private function checkFriendCaller(BadgeCheckContext $context): bool
    {
        $max = 0;
        $current = 0;
        $lastPartnerId = null;

        foreach ($context->takerGameDetails as $game) {
            if (null === $game->partnerId) {
                $current = 0;
                $lastPartnerId = null;

                continue;
            }

            if ($game->partnerId === $lastPartnerId) {
                ++$current;
            } else {
                $current = 1;
                $lastPartnerId = $game->partnerId;
            }

            if ($current >= 5) {
                return true;
            }
        }

        return false;
    }

    /**
     * Taker won a GardeContre.
     */
    private function checkGardeContreWon(BadgeCheckContext $context): bool
    {
        return $context->wonGardeContreCount >= 1;
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
     * Player had >= 5 consecutive losses as taker.
     */
    private function checkLosingStreak(BadgeCheckContext $context): bool
    {
        return $this->maxStreak($context->takerScores, static fn (int $score): bool => $score < 0) >= 5;
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
     * Player received >= 20 stars.
     */
    private function checkRisingStar(BadgeCheckContext $context): bool
    {
        return $context->starEventCount >= 20;
    }

    /**
     * Taker won while calling themselves (no partner).
     */
    private function checkSelfCaller(BadgeCheckContext $context): bool
    {
        foreach ($context->takerGameDetails as $game) {
            if (null === $game->partnerId && $game->takerScore > 0) {
                return true;
            }
        }

        return false;
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
     * Player received 3 stars within a 2-hour window.
     */
    private function checkStarShower(BadgeCheckContext $context): bool
    {
        return $context->hasStarShower;
    }

    /**
     * Taker achieved a non-announced chelem.
     */
    private function checkSurpriseChelem(BadgeCheckContext $context): bool
    {
        return $context->surpriseChelemCount >= 1;
    }

    /**
     * Taker lost with 3 oudlers.
     */
    private function checkThreeOutlersLoss(BadgeCheckContext $context): bool
    {
        foreach ($context->takerGameDetails as $game) {
            if (3 === $game->oudlers && $game->takerScore < 0) {
                return true;
            }
        }

        return false;
    }

    /**
     * Player declared a triple poignée (as taker or defense).
     */
    private function checkTriplePoignee(Player $player, BadgeCheckContext $context): bool
    {
        $playerId = $player->getId();

        // Check taker games: player is taker, poignee=Triple, poigneeOwner=Attack
        foreach ($context->takerGameDetails as $game) {
            if (Poignee::Triple->value === $game->poignee && Side::Attack->value === $game->poigneeOwner) {
                return true;
            }
        }

        // Check all games (including defense): poignee=Triple, poigneeOwner=Defense, player is on defense
        foreach ($context->gamesWithTakerScore as $game) {
            if (Poignee::Triple->value !== $game->poignee || Side::Defense->value !== $game->poigneeOwner) {
                continue;
            }
            $isDefense = $game->takerId !== $playerId
                && (null === $game->partnerId || $game->partnerId !== $playerId);
            if ($isDefense) {
                return true;
            }
        }

        return false;
    }

    /**
     * Player had >= 10 consecutive defense wins.
     * Defense win = game where player was NOT taker AND NOT partner, and taker's score < 0.
     */
    private function checkWall(Player $player, BadgeCheckContext $context): bool
    {
        $playerId = $player->getId();

        return $this->maxStreak(
            $context->gamesWithTakerScore,
            static function (GameTakerScoreDto $game) use ($playerId): bool {
                $isDefense = $game->takerId !== $playerId
                    && (null === $game->partnerId || $game->partnerId !== $playerId);

                return $isDefense && $game->takerScore < 0;
            },
        ) >= 10;
    }

    /**
     * Taker won with 0 oudlers.
     */
    private function checkZeroBout(BadgeCheckContext $context): bool
    {
        foreach ($context->takerGameDetails as $game) {
            if (0 === $game->oudlers && $game->takerScore > 0) {
                return true;
            }
        }

        return false;
    }

    /**
     * @template T
     *
     * @param list<T>           $items
     * @param callable(T): bool $condition
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
