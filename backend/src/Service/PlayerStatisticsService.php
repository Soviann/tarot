<?php

declare(strict_types=1);

namespace App\Service;

use App\Dto\ContractDistributionDto;
use App\Dto\PlayerEloHistoryPointDto;
use App\Dto\RecentScoreDto;
use App\Entity\Player;
use App\Entity\PlayerGroup;
use App\Enum\BadgeType;
use App\Repository\EloHistoryRepository;
use App\Repository\GameRepository;
use App\Repository\PlayerBadgeRepository;
use App\Repository\ScoreEntryRepository;
use App\Repository\StarEventRepository;
use App\Service\Scoring\ScoreCalculator;

/**
 * Statistiques individuelles d'un joueur.
 *
 * Alimente la page « Statistiques joueur » (route GET /api/statistics/players/{id}).
 * Accepte un $playerGroupId optionnel pour filtrer sur un groupe donné.
 *
 * La méthode principale getPlayerStats() agrège en un seul appel :
 * - Scores (moyenne, meilleur, pire, total par rôle)
 * - Répartition des contrats et taux de réussite
 * - Historique ELO et classement
 * - Records personnels (meilleur score, pire score, plus longue série de victoires, plus gros écart)
 * - Étoiles, pénalités, badges débloqués
 * - 50 derniers scores (pour le graphique de tendance)
 * - Durée moyenne et totale de jeu
 */
class PlayerStatisticsService
{
    public function __construct(
        private readonly EloHistoryRepository $eloHistoryRepository,
        private readonly GameRepository $gameRepository,
        private readonly PlayerBadgeRepository $playerBadgeRepository,
        private readonly ScoreEntryRepository $scoreEntryRepository,
        private readonly StarEventRepository $starEventRepository,
    ) {
    }

    /**
     * Historique ELO d'un joueur, trié chronologiquement.
     *
     * Chaque entrée correspond à une donne et inclut la variation (ratingChange)
     * en plus de la valeur absolue (ratingAfter).
     *
     * @return list<array{date: string, gameId: int, ratingAfter: int, ratingChange: int}>
     */
    public function getPlayerEloHistory(Player $player, ?int $playerGroupId = null): array
    {
        $rows = $this->eloHistoryRepository->getPlayerHistory($player, $playerGroupId);

        return \array_map(
            static fn (PlayerEloHistoryPointDto $row) => [
                'date' => $row->date->format(\DateTimeInterface::ATOM),
                'gameId' => $row->gameId,
                'ratingAfter' => $row->ratingAfter,
                'ratingChange' => $row->ratingChange,
            ],
            $rows,
        );
    }

    /**
     * Records personnels d'un joueur.
     *
     * Types de records calculés :
     * - best_score    : meilleur score individuel (tous rôles)
     * - worst_score   : pire score individuel (tous rôles)
     * - win_streak    : plus longue série de victoires consécutives en tant que preneur
     * - biggest_diff  : plus grand écart entre points réalisés et points requis (en tant que preneur)
     * - best_session  : meilleur score cumulé sur une session
     *
     * @return list<array{contract: string|null, date: string, sessionId: int|null, type: string, value: int|float}>
     */
    public function getPlayerRecords(Player $player, ?int $playerGroupId = null): array
    {
        $records = [];

        // 1. Best score (any role)
        $bestScore = $this->scoreEntryRepository->getPlayerBestScore($player, $playerGroupId);
        if (null !== $bestScore) {
            $records[] = [
                'contract' => $bestScore->contract->value,
                'date' => $bestScore->date->format(\DateTimeInterface::ATOM),
                'sessionId' => $bestScore->sessionId,
                'type' => 'best_score',
                'value' => $bestScore->score,
            ];
        }

        // 2. Worst score (any role)
        $worstScore = $this->scoreEntryRepository->getPlayerWorstScore($player, $playerGroupId);
        if (null !== $worstScore) {
            $records[] = [
                'contract' => $worstScore->contract->value,
                'date' => $worstScore->date->format(\DateTimeInterface::ATOM),
                'sessionId' => $worstScore->sessionId,
                'type' => 'worst_score',
                'value' => $worstScore->score,
            ];
        }

        // 3. Win streak + Biggest diff (as taker)
        $takerRows = $this->gameRepository->getPlayerTakerGamesForRecords($player, $playerGroupId);

        if (!empty($takerRows)) {
            // Win streak
            $currentStreak = 0;
            $maxStreak = 0;
            $maxStreakEndDate = null;

            foreach ($takerRows as $row) {
                if ($row->score > 0) {
                    ++$currentStreak;
                    if ($currentStreak > $maxStreak) {
                        $maxStreak = $currentStreak;
                        $maxStreakEndDate = $row->date;
                    }
                } else {
                    $currentStreak = 0;
                }
            }

            if ($maxStreak > 0 && null !== $maxStreakEndDate) {
                $records[] = [
                    'contract' => null,
                    'date' => $maxStreakEndDate->format(\DateTimeInterface::ATOM),
                    'sessionId' => null,
                    'type' => 'win_streak',
                    'value' => $maxStreak,
                ];
            }

            // Biggest point difference
            $maxDiff = 0.0;
            $maxDiffRow = null;

            foreach ($takerRows as $row) {
                if (null === $row->points || null === $row->oudlers) {
                    continue;
                }
                $required = ScoreCalculator::REQUIRED_POINTS[$row->oudlers] ?? 56;
                $diff = \abs($row->points - $required);
                if ($diff > $maxDiff) {
                    $maxDiff = $diff;
                    $maxDiffRow = $row;
                }
            }

            if (null !== $maxDiffRow) {
                $records[] = [
                    'contract' => $maxDiffRow->contract->value,
                    'date' => $maxDiffRow->date->format(\DateTimeInterface::ATOM),
                    'sessionId' => $maxDiffRow->sessionId,
                    'type' => 'biggest_diff',
                    'value' => $maxDiff,
                ];
            }
        }

        // 4. Best session total
        $bestSession = $this->scoreEntryRepository->getPlayerBestSessionTotal($player, $playerGroupId);
        if (null !== $bestSession) {
            $records[] = [
                'contract' => null,
                'date' => $bestSession->firstDate->format(\DateTimeInterface::ATOM),
                'sessionId' => $bestSession->sessionId,
                'type' => 'best_session',
                'value' => $bestSession->total,
            ];
        }

        return $records;
    }

    /**
     * Agrège toutes les statistiques d'un joueur en un seul tableau.
     *
     * Exécute de nombreuses requêtes pour collecter :
     * - Scores agrégés (moyenne, min, max, total)
     * - Nombre de donnes par rôle (preneur, partenaire, défenseur)
     * - Taux de victoire en tant que preneur
     * - Répartition des contrats avec taux de réussite
     * - 50 derniers scores (graphique de tendance)
     * - Étoiles et pénalités associées (1 pénalité pour 3 étoiles)
     * - Badges (débloqués et verrouillés)
     * - Historique ELO et records personnels
     * - Durée moyenne et totale de jeu
     *
     * @return array{badges: list<array{description: string, emoji: string, label: string, type: string, unlockedAt: string|null}>, averageGameDurationSeconds: int|null, averageScore: float, bestGameScore: int, contractDistribution: list<array{contract: string, count: int, winRate: float, wins: int}>, eloHistory: list<array{date: string, gameId: int, ratingAfter: int, ratingChange: int}>, eloRating: int, gamesAsDefender: int, gamesAsPartner: int, gamesAsTaker: int, gamesPlayed: int, player: array{id: int|null, name: string}, playerGroups: list<array{id: int|null, name: string}>, recentScores: list<array{date: string, gameId: int, score: int, sessionId: int}>, records: list<array{contract: string|null, date: string, sessionId: int|null, type: string, value: int|float}>, sessionsPlayed: int, starPenalties: int, totalPlayTimeSeconds: int, totalStars: int, winRateAsTaker: float, worstGameScore: int}
     */
    public function getPlayerStats(Player $player, ?int $playerGroupId = null): array
    {
        $playerId = $player->getId();

        $scoreAgg = $this->scoreEntryRepository->getPlayerScoreAggregates($player, $playerGroupId);
        $gamesPlayed = $scoreAgg['gamesPlayed'];

        $gamesAsTaker = $this->gameRepository->countPlayerGamesAsTaker($player, $playerGroupId);
        $gamesAsPartner = $this->gameRepository->countPlayerGamesAsPartner($player, $playerGroupId);
        $gamesAsDefender = $gamesPlayed - $gamesAsTaker - $gamesAsPartner;

        $winsAsTaker = $this->gameRepository->countPlayerWinsAsTaker($player, $playerGroupId);
        $sessionsPlayed = $this->gameRepository->countPlayerDistinctSessions($player, $playerGroupId);

        $contractRows = $this->gameRepository->getPlayerContractDistribution($player, $playerGroupId);
        $contractWinRows = $this->gameRepository->getPlayerContractWins($player, $playerGroupId);

        /** @var array<string, int> $contractWins */
        $contractWins = [];
        foreach ($contractWinRows as $row) {
            $contractWins[$row->contract->value] = $row->wins;
        }

        $contractDistribution = \array_map(
            static fn (ContractDistributionDto $row) => [
                'contract' => $row->contract->value,
                'count' => $row->count,
                'winRate' => $row->count > 0
                    ? \round(($contractWins[$row->contract->value] ?? 0) / $row->count * 100, 1)
                    : 0.0,
                'wins' => $contractWins[$row->contract->value] ?? 0,
            ],
            $contractRows,
        );

        $recentScores = $this->scoreEntryRepository->getPlayerRecentScores($player, $playerGroupId, 50);
        $formattedRecentScores = \array_map(
            static fn (RecentScoreDto $row) => [
                'date' => $row->date->format(\DateTimeInterface::ATOM),
                'gameId' => $row->gameId,
                'score' => $row->score,
                'sessionId' => $row->sessionId,
            ],
            $recentScores,
        );

        $totalStars = $this->starEventRepository->countByPlayerFiltered($player, $playerGroupId);
        $starPenalties = (int) \floor($totalStars / 3);

        $durationStats = $this->getPlayerDurationStats($player, $playerGroupId);

        return [
            'averageGameDurationSeconds' => $durationStats['averageGameDurationSeconds'],
            'averageScore' => \round($scoreAgg['averageScore'], 1),
            'badges' => $this->getPlayerBadges($player),
            'bestGameScore' => $scoreAgg['bestGameScore'],
            'contractDistribution' => $contractDistribution,
            'eloHistory' => $this->getPlayerEloHistory($player, $playerGroupId),
            'eloRating' => $player->getEloRating(),
            'gamesAsDefender' => $gamesAsDefender,
            'gamesAsPartner' => $gamesAsPartner,
            'gamesAsTaker' => $gamesAsTaker,
            'gamesPlayed' => $gamesPlayed,
            'player' => ['id' => $playerId, 'name' => $player->getName()],
            'playerGroups' => \array_map(
                static fn (PlayerGroup $pg) => ['id' => $pg->getId(), 'name' => $pg->getName()],
                $player->getPlayerGroups()->getValues(),
            ),
            'recentScores' => $formattedRecentScores,
            'records' => $this->getPlayerRecords($player, $playerGroupId),
            'sessionsPlayed' => $sessionsPlayed,
            'starPenalties' => $starPenalties,
            'totalPlayTimeSeconds' => $durationStats['totalPlayTimeSeconds'],
            'totalStars' => $totalStars,
            'winRateAsTaker' => $gamesAsTaker > 0 ? \round($winsAsTaker / $gamesAsTaker * 100, 1) : 0.0,
            'worstGameScore' => $scoreAgg['worstGameScore'],
        ];
    }

    /**
     * Durée moyenne et totale de jeu d'un joueur (basé sur les donnes auxquelles il a participé).
     *
     * @return array{averageGameDurationSeconds: int|null, totalPlayTimeSeconds: int}
     */
    public function getPlayerDurationStats(Player $player, ?int $playerGroupId = null): array
    {
        return $this->gameRepository->getPlayerDurationStats($player, $playerGroupId);
    }

    /**
     * Liste tous les badges (débloqués et verrouillés) pour un joueur.
     *
     * Itère sur tous les BadgeType possibles et enrichit chacun avec la date
     * de déverrouillage (null si pas encore obtenu).
     *
     * @return list<array{description: string, emoji: string, label: string, type: string, unlockedAt: string|null}>
     */
    private function getPlayerBadges(Player $player): array
    {
        $awarded = $this->playerBadgeRepository->getPlayerBadgesWithUnlockDate($player);

        $awardedMap = [];
        foreach ($awarded as $row) {
            $awardedMap[$row->badgeType->value] = $row->unlockedAt->format(\DateTimeInterface::ATOM);
        }

        $badges = [];
        foreach (BadgeType::cases() as $badgeType) {
            $badges[] = [
                ...$badgeType->toArray(),
                'unlockedAt' => $awardedMap[$badgeType->value] ?? null,
            ];
        }

        return $badges;
    }
}
