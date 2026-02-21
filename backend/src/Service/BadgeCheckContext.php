<?php

declare(strict_types=1);

namespace App\Service;

use App\Dto\GameTakerScoreDto;
use App\Dto\TakerGameDetailDto;

/**
 * Données pré-chargées en batch pour l'évaluation des badges d'un joueur.
 *
 * Construit une seule fois par joueur via BadgeChecker::buildContexts(),
 * évitant ainsi les requêtes individuelles par joueur et par badge.
 */
final readonly class BadgeCheckContext
{
    /**
     * @param list<int>                $distinctSessionIds
     * @param list<GameTakerScoreDto>  $gamesWithTakerScore
     * @param list<int>                $marathonSessionIds
     * @param list<TakerGameDetailDto> $takerGameDetails
     * @param list<int>                $takerScores
     */
    public function __construct(
        public int $announcedChelemCount = 0,
        public int $chelemAnnouncedWonCount = 0,
        public int $coPlayerCount = 0,
        public int $completedGameCount = 0,
        public array $distinctSessionIds = [],
        public int $distinctSessionCount = 0,
        public int $gardeContreCount = 0,
        public array $gamesWithTakerScore = [],
        public bool $hasStarShower = false,
        public array $marathonSessionIds = [],
        public int $nightOwlCount = 0,
        public int $starEventCount = 0,
        public int $surpriseChelemCount = 0,
        public array $takerGameDetails = [],
        public array $takerScores = [],
        public int $wonGardeContreCount = 0,
        public int $wonGardeSansCount = 0,
        public int $wonPetitAuBoutAttackCount = 0,
    ) {
    }
}
