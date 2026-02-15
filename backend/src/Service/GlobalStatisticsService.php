<?php

declare(strict_types=1);

namespace App\Service;

use App\Dto\ContractDistributionDto;
use App\Dto\EloRankingEntryDto;
use App\Dto\LeaderboardScoreDto;
use App\Repository\EloHistoryRepository;
use App\Repository\GameRepository;
use App\Repository\ScoreEntryRepository;
use App\Repository\SessionRepository;
use App\Repository\StarEventRepository;

/**
 * Statistiques globales agrégées sur l'ensemble des joueurs et des donnes.
 *
 * Alimente la page « Statistiques » (route GET /api/statistics).
 * Chaque méthode accepte un $playerGroupId optionnel pour filtrer les résultats
 * sur un groupe de joueurs donné (jointure dynamique sur Session.playerGroup).
 *
 * Méthodes principales :
 * - getLeaderboard()             — classement général (score total, parties jouées, winRate)
 * - getContractDistribution()    — répartition des contrats joués (avec pourcentage)
 * - getContractSuccessRateByPlayer() — taux de réussite par contrat et par joueur
 * - getEloRanking()              — classement ELO courant
 * - getAllPlayersEloHistory()     — historique ELO complet (pour le graphique d'évolution)
 * - getAverageGameDurationSeconds() / getTotalPlayTimeSeconds() — métriques de durée
 * - getTotalGames() / getTotalSessions() / getTotalStars() — compteurs globaux
 */
final readonly class GlobalStatisticsService
{
    public function __construct(
        private readonly EloHistoryRepository $eloHistoryRepository,
        private readonly GameRepository $gameRepository,
        private readonly ScoreEntryRepository $scoreEntryRepository,
        private readonly SessionRepository $sessionRepository,
        private readonly StarEventRepository $starEventRepository,
    ) {
    }

    /**
     * Taux de réussite par contrat pour chaque joueur.
     *
     * Exécute deux requêtes :
     * 1. Nombre de fois où chaque joueur a pris chaque contrat.
     * 2. Nombre de victoires (score preneur > 0) par joueur et contrat.
     * Fusionne les résultats via une map playerId_contract → wins.
     *
     * @return list<array{color: string|null, contracts: list<array{contract: string, count: int, winRate: float, wins: int}>, id: int, name: string}>
     */
    public function getContractSuccessRateByPlayer(?int $playerGroupId = null): array
    {
        $countRows = $this->gameRepository->getContractCountByPlayer($playerGroupId);

        if (empty($countRows)) {
            return [];
        }

        $winRows = $this->gameRepository->getContractWinsByPlayer($playerGroupId);

        /** @var array<string, int> $winsMap */
        $winsMap = [];
        foreach ($winRows as $row) {
            $winsMap[$row->playerId.'_'.$row->contract->value] = $row->wins;
        }

        /** @var array<int, array{color: string|null, contracts: list<array{contract: string, count: int, winRate: float, wins: int}>, id: int, name: string}> $grouped */
        $grouped = [];
        foreach ($countRows as $row) {
            $contract = $row->contract->value;
            $wins = $winsMap[$row->playerId.'_'.$contract] ?? 0;

            if (!isset($grouped[$row->playerId])) {
                $grouped[$row->playerId] = [
                    'color' => $row->playerColor,
                    'contracts' => [],
                    'id' => $row->playerId,
                    'name' => $row->playerName,
                ];
            }

            $grouped[$row->playerId]['contracts'][] = [
                'contract' => $contract,
                'count' => $row->count,
                'winRate' => $row->count > 0 ? \round($wins / $row->count * 100, 1) : 0.0,
                'wins' => $wins,
            ];
        }

        return \array_values($grouped);
    }

    /**
     * Répartition des contrats joués (nombre et pourcentage sur le total des donnes).
     *
     * @return list<array{contract: string, count: int, percentage: float}>
     */
    public function getContractDistribution(?int $playerGroupId = null): array
    {
        $total = $this->getTotalGames($playerGroupId);
        if (0 === $total) {
            return [];
        }

        $rows = $this->gameRepository->getContractDistribution($playerGroupId);

        return \array_map(
            static fn (ContractDistributionDto $row) => [
                'contract' => $row->contract->value,
                'count' => $row->count,
                'percentage' => \round($row->count / $total * 100, 2),
            ],
            $rows,
        );
    }

    /**
     * Historique ELO complet de tous les joueurs, trié par ordre chronologique.
     *
     * Utilisé pour tracer le graphique d'évolution globale ELO.
     * Les résultats sont groupés par joueur (playerId → liste de points).
     *
     * @return list<array{history: list<array{date: string, gameId: int, ratingAfter: int}>, playerColor: string|null, playerId: int, playerName: string}>
     */
    public function getAllPlayersEloHistory(?int $playerGroupId = null): array
    {
        $rows = $this->eloHistoryRepository->getAllPlayersHistory($playerGroupId);

        /** @var array<int, array{history: list<array{date: string, gameId: int, ratingAfter: int}>, playerColor: string|null, playerId: int, playerName: string}> $grouped */
        $grouped = [];
        foreach ($rows as $row) {
            if (!isset($grouped[$row->playerId])) {
                $grouped[$row->playerId] = [
                    'history' => [],
                    'playerColor' => $row->playerColor,
                    'playerId' => $row->playerId,
                    'playerName' => $row->playerName,
                ];
            }
            $grouped[$row->playerId]['history'][] = [
                'date' => $row->date->format(\DateTimeInterface::ATOM),
                'gameId' => $row->gameId,
                'ratingAfter' => $row->ratingAfter,
            ];
        }

        return \array_values($grouped);
    }

    /**
     * Classement ELO courant de tous les joueurs ayant un historique ELO.
     *
     * Trié par eloRating décroissant. Le nombre de parties jouées est déduit
     * du nombre d'entrées distinctes dans EloHistory (une par donne).
     *
     * @return list<array{eloRating: int, gamesPlayed: int, playerColor: string|null, playerId: int, playerName: string}>
     */
    public function getEloRanking(?int $playerGroupId = null): array
    {
        $rows = $this->eloHistoryRepository->getEloRanking($playerGroupId);

        return \array_map(
            static fn (EloRankingEntryDto $row) => [
                'eloRating' => $row->eloRating,
                'gamesPlayed' => $row->gamesPlayed,
                'playerColor' => $row->playerColor,
                'playerId' => $row->playerId,
                'playerName' => $row->playerName,
            ],
            $rows,
        );
    }

    /**
     * Classement général des joueurs par score total décroissant.
     *
     * Agrège quatre requêtes :
     * 1. Score total par joueur (inclut les pénalités étoiles via ScoreEntry sans game).
     * 2. Nombre de donnes jouées (via ScoreEntry avec game complété).
     * 3. Nombre de donnes en tant que preneur.
     * 4. Nombre de victoires en tant que preneur (score preneur > 0).
     *
     * Le winRate est calculé comme : victoires / donnes en tant que preneur × 100.
     *
     * @return list<array{gamesAsTaker: int, gamesPlayed: int, playerColor: string|null, playerId: int, playerName: string, totalScore: int, winRate: float, wins: int}>
     */
    public function getLeaderboard(?int $playerGroupId = null): array
    {
        $scoreRows = $this->scoreEntryRepository->getLeaderboardScores($playerGroupId);

        if (empty($scoreRows)) {
            return [];
        }

        $gamesPlayedRows = $this->scoreEntryRepository->countGamesPlayedByPlayer($playerGroupId);

        /** @var array<int, int> $gamesPlayed */
        $gamesPlayed = [];
        foreach ($gamesPlayedRows as $row) {
            $gamesPlayed[$row->playerId] = $row->gamesPlayed;
        }

        $takerRows = $this->gameRepository->countTakerGames($playerGroupId);

        /** @var array<int, int> $gamesAsTaker */
        $gamesAsTaker = [];
        foreach ($takerRows as $row) {
            $gamesAsTaker[$row->playerId] = $row->count;
        }

        $winRows = $this->gameRepository->countTakerWins($playerGroupId);

        /** @var array<int, int> $wins */
        $wins = [];
        foreach ($winRows as $row) {
            $wins[$row->playerId] = $row->count;
        }

        return \array_map(
            static fn (LeaderboardScoreDto $row) => [
                'gamesAsTaker' => $gamesAsTaker[$row->playerId] ?? 0,
                'gamesPlayed' => $gamesPlayed[$row->playerId] ?? 0,
                'playerColor' => $row->playerColor,
                'playerId' => $row->playerId,
                'playerName' => $row->playerName,
                'totalScore' => $row->totalScore,
                'winRate' => ($gamesAsTaker[$row->playerId] ?? 0) > 0
                    ? \round(($wins[$row->playerId] ?? 0) / $gamesAsTaker[$row->playerId] * 100, 1)
                    : 0.0,
                'wins' => $wins[$row->playerId] ?? 0,
            ],
            $scoreRows,
        );
    }

    /**
     * Durée moyenne d'une donne en secondes (entre createdAt et completedAt).
     */
    public function getAverageGameDurationSeconds(?int $playerGroupId = null): ?int
    {
        return $this->gameRepository->getAverageDurationSeconds($playerGroupId);
    }

    /**
     * Temps de jeu total cumulé en secondes (somme des durées de toutes les donnes).
     */
    public function getTotalPlayTimeSeconds(?int $playerGroupId = null): int
    {
        return $this->gameRepository->getTotalDurationSeconds($playerGroupId);
    }

    /** Nombre total d'étoiles (StarEvent) attribuées. */
    public function getTotalStars(?int $playerGroupId = null): int
    {
        return $this->starEventRepository->countAll($playerGroupId);
    }

    /** Nombre total de donnes terminées (status = Completed). */
    public function getTotalGames(?int $playerGroupId = null): int
    {
        return $this->gameRepository->countCompleted($playerGroupId);
    }

    /** Nombre total de sessions créées. */
    public function getTotalSessions(?int $playerGroupId = null): int
    {
        return $this->sessionRepository->countAll($playerGroupId);
    }
}
