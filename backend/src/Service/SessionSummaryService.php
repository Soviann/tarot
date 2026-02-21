<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Session;
use App\Enum\Contract;
use App\Repository\GameRepository;
use App\Repository\ScoreEntryRepository;
use App\Repository\StarEventRepository;

/**
 * Génère le résumé de fin de session affiché sur la page « Résumé ».
 *
 * Route : GET /api/sessions/{id}/summary (via SessionController).
 *
 * Le résumé comprend :
 * - ranking     : classement final des joueurs (score total + position, ex-aequo gérés)
 * - scoreSpread : écart de points entre le premier et le dernier
 * - highlights  : faits marquants (MVP, dernier, meilleure/pire donne, contrat favori,
 *                 durée totale, nombre de donnes et d'étoiles)
 * - awards      : récompenses humoristiques attribuées si >= 3 donnes jouées :
 *     • Le Boucher          — preneur ayant infligé le plus de points aux défenseurs
 *     • L'Éternel Défenseur — joueur ayant le moins pris
 *     • Le Flambeur         — joueur ayant tenté le plus de Garde Sans / Garde Contre
 *     • Le Kamikaze         — preneur avec le pire taux de réussite (min 2 prises)
 *     • Le Solitaire        — joueur le moins appelé comme partenaire
 *     • Le Paratonnerre     — joueur ayant reçu le plus d'étoiles
 *     • Le Yo-Yo            — joueur avec la plus grande variance de scores
 *     • Le Régulier         — joueur avec les scores les plus constants
 */
final readonly class SessionSummaryService
{
    public function __construct(
        private GameRepository $gameRepository,
        private ScoreEntryRepository $scoreEntryRepository,
        private StarEventRepository $starEventRepository,
    ) {
    }

    /**
     * @return array{awards: list<array{description: string, playerColor: string|null, playerId: int, playerName: string, title: string}>, highlights: array{bestGame: array{contract: string, gameId: int, playerName: string, score: int}|null, duration: int, lastPlace: array{playerId: int, playerName: string, score: int}, mostPlayedContract: array{contract: string, count: int}|null, mvp: array{playerId: int, playerName: string, score: int}, totalGames: int, totalStars: int, worstGame: array{contract: string, gameId: int, playerName: string, score: int}|null}, ranking: list<array{playerColor: string|null, playerId: int, playerName: string, position: int, score: int}>, scoreSpread: int}
     */
    public function getSummary(Session $session): array
    {
        $ranking = $this->computeRanking($session);
        $totalGames = $this->countCompletedGames($session);
        $highlights = $this->computeHighlights($session, $ranking, $totalGames);
        $awards = $totalGames >= 3 ? $this->computeAwards($session) : [];

        return [
            'awards' => $awards,
            'highlights' => $highlights,
            'ranking' => $ranking,
            'scoreSpread' => !empty($ranking) ? $ranking[0]['score'] - $ranking[\count($ranking) - 1]['score'] : 0,
        ];
    }

    /**
     * Calcule le classement final d'une session.
     *
     * Le score total inclut :
     * - Les scores des donnes complétées (via ScoreEntry liées à un Game)
     * - Les pénalités d'étoiles (ScoreEntry sans Game, liées directement à la session)
     *
     * Les ex-aequo partagent la même position (ex : 1er, 1er, 3e, 4e, 5e).
     *
     * @return list<array{playerColor: string|null, playerId: int, playerName: string, position: int, score: int}>
     */
    private function computeRanking(Session $session): array
    {
        // Get score sums from completed games
        $scoreMap = $this->scoreEntryRepository->getCompletedGameScoresByPlayer($session);

        // Also add star event scores (score entries with game = null and session = this session)
        $starScoreMap = $this->scoreEntryRepository->getStarPenaltyScoresByPlayer($session);

        foreach ($starScoreMap as $playerId => $starScore) {
            $scoreMap[$playerId] = ($scoreMap[$playerId] ?? 0) + $starScore;
        }

        // Build ranking including all session players
        $ranking = [];
        foreach ($session->getPlayers() as $player) {
            /** @var int $playerId */
            $playerId = $player->getId();
            $ranking[] = [
                'playerColor' => $player->getColor(),
                'playerId' => $playerId,
                'playerName' => $player->getName(),
                'position' => 0, // assigned below
                'score' => $scoreMap[$playerId] ?? 0,
            ];
        }

        // Sort by score DESC
        \usort($ranking, static fn (array $a, array $b) => $b['score'] <=> $a['score']);

        // Assign positions (ties share the same position)
        $position = 1;
        foreach ($ranking as $i => &$rank) {
            if ($i > 0 && $rank['score'] < $ranking[$i - 1]['score']) {
                $position = $i + 1;
            }
            $rank['position'] = $position;
        }
        unset($rank);

        return $ranking;
    }

    /** Nombre de donnes terminées dans la session. */
    private function countCompletedGames(Session $session): int
    {
        return $this->gameRepository->countCompletedForSession($session);
    }

    /**
     * Faits marquants de la session (MVP, dernier, meilleure/pire donne, etc.).
     *
     * @param list<array{playerColor: string|null, playerId: int, playerName: string, position: int, score: int}> $ranking
     *
     * @return array{bestGame: array{contract: string, gameId: int, playerName: string, score: int}|null, duration: int, lastPlace: array{playerId: int, playerName: string, score: int}, mostPlayedContract: array{contract: string, count: int}|null, mvp: array{playerId: int, playerName: string, score: int}, totalGames: int, totalStars: int, worstGame: array{contract: string, gameId: int, playerName: string, score: int}|null}
     */
    private function computeHighlights(Session $session, array $ranking, int $totalGames): array
    {
        $first = $ranking[0] ?? null;
        $last = $ranking[\count($ranking) - 1] ?? null;

        return [
            'bestGame' => $this->findBestGame($session),
            'duration' => $this->computeDuration($session),
            'lastPlace' => null !== $last ? [
                'playerId' => $last['playerId'],
                'playerName' => $last['playerName'],
                'score' => $last['score'],
            ] : ['playerId' => 0, 'playerName' => '', 'score' => 0],
            'mostPlayedContract' => $this->findMostPlayedContract($session),
            'mvp' => null !== $first ? [
                'playerId' => $first['playerId'],
                'playerName' => $first['playerName'],
                'score' => $first['score'],
            ] : ['playerId' => 0, 'playerName' => '', 'score' => 0],
            'totalGames' => $totalGames,
            'totalStars' => $this->countStarEvents($session),
            'worstGame' => $this->findWorstGame($session),
        ];
    }

    /**
     * Meilleure donne de la session (score le plus élevé du preneur).
     *
     * @return array{contract: string, gameId: int, playerName: string, score: int}|null
     */
    private function findBestGame(Session $session): ?array
    {
        $dto = $this->scoreEntryRepository->findBestTakerGameForSession($session);

        if (null === $dto) {
            return null;
        }

        return [
            'contract' => $dto->contract->value,
            'gameId' => $dto->gameId,
            'playerName' => $dto->playerName,
            'score' => $dto->score,
        ];
    }

    /**
     * Pire donne de la session (score le plus bas du preneur).
     *
     * @return array{contract: string, gameId: int, playerName: string, score: int}|null
     */
    private function findWorstGame(Session $session): ?array
    {
        $dto = $this->scoreEntryRepository->findWorstTakerGameForSession($session);

        if (null === $dto) {
            return null;
        }

        return [
            'contract' => $dto->contract->value,
            'gameId' => $dto->gameId,
            'playerName' => $dto->playerName,
            'score' => $dto->score,
        ];
    }

    /**
     * Contrat le plus joué dans la session.
     *
     * @return array{contract: string, count: int}|null
     */
    private function findMostPlayedContract(Session $session): ?array
    {
        $dto = $this->gameRepository->findMostPlayedContractForSession($session);

        if (null === $dto) {
            return null;
        }

        return [
            'contract' => $dto->contract->value,
            'count' => $dto->count,
        ];
    }

    /**
     * Durée de la session en secondes (entre la création et la dernière donne complétée).
     */
    private function computeDuration(Session $session): int
    {
        $maxCompletedAt = $this->gameRepository->getMaxCompletedAtForSession($session);

        if (null === $maxCompletedAt) {
            return 0;
        }

        $lastCompletedAt = new \DateTimeImmutable($maxCompletedAt);

        return (int) \abs($lastCompletedAt->getTimestamp() - $session->getCreatedAt()->getTimestamp());
    }

    /** Nombre d'étoiles attribuées pendant la session. */
    private function countStarEvents(Session $session): int
    {
        return $this->starEventRepository->countBySession($session);
    }

    /**
     * Récompenses humoristiques de fin de session (attribuées si >= 3 donnes).
     *
     * @return list<array{description: string, playerColor: string|null, playerId: int, playerName: string, title: string}>
     */
    private function computeAwards(Session $session): array
    {
        $awards = [];

        // 1. Le Boucher: taker with highest total taker-score
        $boucher = $this->computeBoucher($session);
        if (null !== $boucher) {
            $awards[] = $boucher;
        }

        // 2. L'Eternel Defenseur: player who took the least
        $defenseur = $this->computeEternelDefenseur($session);
        if (null !== $defenseur) {
            $awards[] = $defenseur;
        }

        // 3. Le Flambeur: most Garde Sans / Garde Contre attempts
        $flambeur = $this->computeFlambeur($session);
        if (null !== $flambeur) {
            $awards[] = $flambeur;
        }

        // 4. Le Kamikaze: worst taker win rate (min 2 takes, at least 1 loss)
        $kamikaze = $this->computeKamikaze($session);
        if (null !== $kamikaze) {
            $awards[] = $kamikaze;
        }

        // 5. Le Solitaire: least called as partner
        $solitaire = $this->computeSolitaire($session);
        if (null !== $solitaire) {
            $awards[] = $solitaire;
        }

        // 6. Le Paratonnerre: most stars received
        $paratonnerre = $this->computeParatonnerre($session);
        if (null !== $paratonnerre) {
            $awards[] = $paratonnerre;
        }

        // 7 & 8. Le Yo-Yo + Le Régulier: highest / lowest score variance
        $scoresMap = $this->scoreEntryRepository->getOrderedGameScoresPerPlayerForSession($session);
        $yoyo = $this->computeYoYo($session, $scoresMap);
        if (null !== $yoyo) {
            $awards[] = $yoyo;
        }
        $regulier = $this->computeRegulier($session, $scoresMap, $yoyo['playerId'] ?? null);
        if (null !== $regulier) {
            $awards[] = $regulier;
        }

        return $awards;
    }

    /**
     * « Le Boucher » : preneur avec le plus grand total de scores positifs.
     *
     * Non attribué si aucun preneur n'a un total positif.
     *
     * @return array{description: string, playerColor: string|null, playerId: int, playerName: string, title: string}|null
     */
    private function computeBoucher(Session $session): ?array
    {
        $result = $this->scoreEntryRepository->getTotalTakerScoreByPlayerForSession($session);

        if (null === $result || $result->totalTakerScore <= 0) {
            return null;
        }

        return [
            'description' => 'A infligé le plus de points aux défenseurs',
            'playerColor' => $result->playerColor,
            'playerId' => $result->playerId,
            'playerName' => $result->playerName,
            'title' => 'Le Boucher',
        ];
    }

    /**
     * « L'Éternel Défenseur » : joueur ayant pris le moins souvent.
     *
     * Compare le nombre de donnes en tant que preneur pour chaque joueur
     * de la session (y compris 0 si le joueur n'a jamais pris).
     *
     * @return array{description: string, playerColor: string|null, playerId: int, playerName: string, title: string}|null
     */
    private function computeEternelDefenseur(Session $session): ?array
    {
        // Count games as taker per player
        $takerCountMap = $this->gameRepository->countTakerGamesPerPlayerForSession($session);

        // Find the player with fewest takes (include 0)
        $minCount = \PHP_INT_MAX;
        $winner = null;
        foreach ($session->getPlayers() as $player) {
            $count = $takerCountMap[$player->getId()] ?? 0;
            if ($count < $minCount) {
                $minCount = $count;
                $winner = $player;
            }
        }

        if (null === $winner) {
            return null;
        }

        /** @var int $winnerId */
        $winnerId = $winner->getId();

        return [
            'description' => 'A le moins pris',
            'playerColor' => $winner->getColor(),
            'playerId' => $winnerId,
            'playerName' => $winner->getName(),
            'title' => 'L\'Éternel Défenseur',
        ];
    }

    /**
     * « Le Flambeur » : joueur ayant tenté le plus de Garde Sans / Garde Contre.
     *
     * Non attribué si aucun joueur n'a tenté ces contrats dans la session.
     *
     * @return array{description: string, playerColor: string|null, playerId: int, playerName: string, title: string}|null
     */
    private function computeFlambeur(Session $session): ?array
    {
        $result = $this->gameRepository->getHighContractTakerCountsForSession(
            $session,
            [Contract::GardeSans, Contract::GardeContre]
        );

        if (null === $result) {
            return null;
        }

        return [
            'description' => 'A tenté le plus de Garde Sans/Contre',
            'playerColor' => $result->playerColor,
            'playerId' => $result->playerId,
            'playerName' => $result->playerName,
            'title' => 'Le Flambeur',
        ];
    }

    /**
     * « Le Kamikaze » : preneur avec le pire taux de réussite (min 2 prises, au moins 1 échec).
     *
     * @return array{description: string, playerColor: string|null, playerId: int, playerName: string, title: string}|null
     */
    private function computeKamikaze(Session $session): ?array
    {
        $takerCounts = $this->gameRepository->countTakerGamesPerPlayerForSession($session);
        $takerWins = $this->gameRepository->countTakerWinsPerPlayerForSession($session);

        $worstRate = -1.0;
        $winner = null;

        foreach ($session->getPlayers() as $player) {
            /** @var int $playerId */
            $playerId = $player->getId();
            $takes = $takerCounts[$playerId] ?? 0;

            if ($takes < 2) {
                continue;
            }

            $wins = $takerWins[$playerId] ?? 0;
            $losses = $takes - $wins;

            if (0 === $losses) {
                continue;
            }

            $loseRate = $losses / $takes;

            if ($loseRate > $worstRate) {
                $worstRate = $loseRate;
                $winner = $player;
            }
        }

        if (null === $winner) {
            return null;
        }

        /** @var int $winnerId */
        $winnerId = $winner->getId();

        return [
            'description' => 'Échoue le plus souvent en tant que preneur',
            'playerColor' => $winner->getColor(),
            'playerId' => $winnerId,
            'playerName' => $winner->getName(),
            'title' => 'Le Kamikaze',
        ];
    }

    /**
     * « Le Solitaire » : joueur le moins souvent appelé comme partenaire.
     *
     * Non attribué si aucune donne avec appel dans la session.
     *
     * @return array{description: string, playerColor: string|null, playerId: int, playerName: string, title: string}|null
     */
    private function computeSolitaire(Session $session): ?array
    {
        $partnerCounts = $this->gameRepository->countPartnerAppearancesPerPlayerForSession($session);

        if ([] === $partnerCounts) {
            return null;
        }

        $minCount = \PHP_INT_MAX;
        $winner = null;

        foreach ($session->getPlayers() as $player) {
            /** @var int $playerId */
            $playerId = $player->getId();
            $count = $partnerCounts[$playerId] ?? 0;

            if ($count < $minCount) {
                $minCount = $count;
                $winner = $player;
            }
        }

        if (null === $winner) {
            return null;
        }

        /** @var int $winnerId */
        $winnerId = $winner->getId();

        return [
            'description' => 'Le moins appelé comme partenaire',
            'playerColor' => $winner->getColor(),
            'playerId' => $winnerId,
            'playerName' => $winner->getName(),
            'title' => 'Le Solitaire',
        ];
    }

    /**
     * « Le Paratonnerre » : joueur ayant reçu le plus d'étoiles dans la session.
     *
     * Non attribué si aucune étoile dans la session.
     *
     * @return array{description: string, playerColor: string|null, playerId: int, playerName: string, title: string}|null
     */
    private function computeParatonnerre(Session $session): ?array
    {
        $maxStars = 0;
        $winner = null;

        foreach ($session->getPlayers() as $player) {
            $count = $this->starEventRepository->countBySessionAndPlayer($session, $player);

            if ($count > $maxStars) {
                $maxStars = $count;
                $winner = $player;
            }
        }

        if (null === $winner || 0 === $maxStars) {
            return null;
        }

        /** @var int $winnerId */
        $winnerId = $winner->getId();

        return [
            'description' => 'A attiré le plus d\'étoiles',
            'playerColor' => $winner->getColor(),
            'playerId' => $winnerId,
            'playerName' => $winner->getName(),
            'title' => 'Le Paratonnerre',
        ];
    }

    /**
     * « Le Yo-Yo » : joueur avec la plus grande variance de scores.
     *
     * @param array<int, list<int>> $scoresMap
     *
     * @return array{description: string, playerColor: string|null, playerId: int, playerName: string, title: string}|null
     */
    private function computeYoYo(Session $session, array $scoresMap): ?array
    {
        $maxVariance = -1.0;
        $winner = null;

        foreach ($session->getPlayers() as $player) {
            /** @var int $playerId */
            $playerId = $player->getId();
            $scores = $scoresMap[$playerId] ?? [];

            if (\count($scores) < 3) {
                continue;
            }

            $variance = $this->computeVariance($scores);

            if ($variance > $maxVariance) {
                $maxVariance = $variance;
                $winner = $player;
            }
        }

        if (null === $winner) {
            return null;
        }

        /** @var int $winnerId */
        $winnerId = $winner->getId();

        return [
            'description' => 'Les scores les plus imprévisibles',
            'playerColor' => $winner->getColor(),
            'playerId' => $winnerId,
            'playerName' => $winner->getName(),
            'title' => 'Le Yo-Yo',
        ];
    }

    /**
     * « Le Régulier » : joueur avec les scores les plus constants (plus petite variance).
     *
     * Exclut le gagnant du Yo-Yo pour éviter qu'un même joueur reçoive les deux.
     *
     * @param array<int, list<int>> $scoresMap
     *
     * @return array{description: string, playerColor: string|null, playerId: int, playerName: string, title: string}|null
     */
    private function computeRegulier(Session $session, array $scoresMap, ?int $excludePlayerId): ?array
    {
        $minVariance = \PHP_FLOAT_MAX;
        $winner = null;

        foreach ($session->getPlayers() as $player) {
            /** @var int $playerId */
            $playerId = $player->getId();

            if ($playerId === $excludePlayerId) {
                continue;
            }

            $scores = $scoresMap[$playerId] ?? [];

            if (\count($scores) < 3) {
                continue;
            }

            $variance = $this->computeVariance($scores);

            if ($variance < $minVariance) {
                $minVariance = $variance;
                $winner = $player;
            }
        }

        if (null === $winner) {
            return null;
        }

        /** @var int $winnerId */
        $winnerId = $winner->getId();

        return [
            'description' => 'Les scores les plus réguliers',
            'playerColor' => $winner->getColor(),
            'playerId' => $winnerId,
            'playerName' => $winner->getName(),
            'title' => 'Le Régulier',
        ];
    }

    /**
     * @param list<int> $scores
     */
    private function computeVariance(array $scores): float
    {
        $n = \count($scores);
        $mean = \array_sum($scores) / $n;
        $sumSquares = 0.0;

        foreach ($scores as $score) {
            $sumSquares += ($score - $mean) ** 2;
        }

        return $sumSquares / $n;
    }
}
