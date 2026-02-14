<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Session;
use App\Enum\Contract;
use App\Enum\GameStatus;
use Doctrine\ORM\EntityManagerInterface;

class SessionSummaryService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
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
     * @return list<array{playerColor: string|null, playerId: int, playerName: string, position: int, score: int}>
     */
    private function computeRanking(Session $session): array
    {
        // Get score sums from completed games
        /** @var list<array{playerId: int|string, totalScore: int|string}> $scoreRows */
        $scoreRows = $this->em->createQuery(
            'SELECT IDENTITY(se.player) AS playerId, SUM(se.score) AS totalScore
             FROM App\Entity\ScoreEntry se
             JOIN se.game g
             WHERE g.session = :session AND g.status = :status
             GROUP BY se.player'
        )
            ->setParameter('session', $session)
            ->setParameter('status', GameStatus::Completed)
            ->getResult();

        /** @var array<int, int> $scoreMap */
        $scoreMap = [];
        foreach ($scoreRows as $row) {
            $scoreMap[(int) $row['playerId']] = (int) $row['totalScore'];
        }

        // Also add star event scores (score entries with game = null and session = this session)
        /** @var list<array{playerId: int|string, totalScore: int|string}> $starScoreRows */
        $starScoreRows = $this->em->createQuery(
            'SELECT IDENTITY(se.player) AS playerId, SUM(se.score) AS totalScore
             FROM App\Entity\ScoreEntry se
             WHERE se.session = :session AND se.game IS NULL
             GROUP BY se.player'
        )
            ->setParameter('session', $session)
            ->getResult();

        foreach ($starScoreRows as $row) {
            $playerId = (int) $row['playerId'];
            $scoreMap[$playerId] = ($scoreMap[$playerId] ?? 0) + (int) $row['totalScore'];
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

    private function countCompletedGames(Session $session): int
    {
        return (int) $this->em->createQuery(
            'SELECT COUNT(g.id)
             FROM App\Entity\Game g
             WHERE g.session = :session AND g.status = :status'
        )
            ->setParameter('session', $session)
            ->setParameter('status', GameStatus::Completed)
            ->getSingleScalarResult();
    }

    /**
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
     * @return array{contract: string, gameId: int, playerName: string, score: int}|null
     */
    private function findBestGame(Session $session): ?array
    {
        /** @var list<array{contract: Contract, gameId: int|string, playerName: string, score: int|string}> $rows */
        $rows = $this->em->createQuery(
            'SELECT g.id AS gameId, p.name AS playerName, g.contract AS contract, se.score AS score
             FROM App\Entity\ScoreEntry se
             JOIN se.game g
             JOIN g.taker p
             WHERE g.session = :session AND g.status = :status AND se.player = g.taker
             ORDER BY se.score DESC'
        )
            ->setParameter('session', $session)
            ->setParameter('status', GameStatus::Completed)
            ->setMaxResults(1)
            ->getResult();

        if (empty($rows)) {
            return null;
        }

        $row = $rows[0];

        return [
            'contract' => $row['contract']->value,
            'gameId' => (int) $row['gameId'],
            'playerName' => $row['playerName'],
            'score' => (int) $row['score'],
        ];
    }

    /**
     * @return array{contract: string, gameId: int, playerName: string, score: int}|null
     */
    private function findWorstGame(Session $session): ?array
    {
        /** @var list<array{contract: Contract, gameId: int|string, playerName: string, score: int|string}> $rows */
        $rows = $this->em->createQuery(
            'SELECT g.id AS gameId, p.name AS playerName, g.contract AS contract, se.score AS score
             FROM App\Entity\ScoreEntry se
             JOIN se.game g
             JOIN g.taker p
             WHERE g.session = :session AND g.status = :status AND se.player = g.taker
             ORDER BY se.score ASC'
        )
            ->setParameter('session', $session)
            ->setParameter('status', GameStatus::Completed)
            ->setMaxResults(1)
            ->getResult();

        if (empty($rows)) {
            return null;
        }

        $row = $rows[0];

        return [
            'contract' => $row['contract']->value,
            'gameId' => (int) $row['gameId'],
            'playerName' => $row['playerName'],
            'score' => (int) $row['score'],
        ];
    }

    /**
     * @return array{contract: string, count: int}|null
     */
    private function findMostPlayedContract(Session $session): ?array
    {
        /** @var list<array{contract: Contract, count: int|string}> $rows */
        $rows = $this->em->createQuery(
            'SELECT g.contract AS contract, COUNT(g.id) AS count
             FROM App\Entity\Game g
             WHERE g.session = :session AND g.status = :status
             GROUP BY g.contract
             ORDER BY count DESC'
        )
            ->setParameter('session', $session)
            ->setParameter('status', GameStatus::Completed)
            ->setMaxResults(1)
            ->getResult();

        if (empty($rows)) {
            return null;
        }

        return [
            'contract' => $rows[0]['contract']->value,
            'count' => (int) $rows[0]['count'],
        ];
    }

    private function computeDuration(Session $session): int
    {
        /** @var string|null $maxCompletedAt */
        $maxCompletedAt = $this->em->createQuery(
            'SELECT MAX(g.completedAt)
             FROM App\Entity\Game g
             WHERE g.session = :session AND g.status = :status AND g.completedAt IS NOT NULL'
        )
            ->setParameter('session', $session)
            ->setParameter('status', GameStatus::Completed)
            ->getSingleScalarResult();

        if (null === $maxCompletedAt) {
            return 0;
        }

        $lastCompletedAt = new \DateTimeImmutable($maxCompletedAt);

        return (int) \abs($lastCompletedAt->getTimestamp() - $session->getCreatedAt()->getTimestamp());
    }

    private function countStarEvents(Session $session): int
    {
        return (int) $this->em->createQuery(
            'SELECT COUNT(se.id)
             FROM App\Entity\StarEvent se
             WHERE se.session = :session'
        )
            ->setParameter('session', $session)
            ->getSingleScalarResult();
    }

    /**
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

        return $awards;
    }

    /**
     * @return array{description: string, playerColor: string|null, playerId: int, playerName: string, title: string}|null
     */
    private function computeBoucher(Session $session): ?array
    {
        /** @var list<array{playerColor: string|null, playerId: int|string, playerName: string, totalTakerScore: int|string}> $rows */
        $rows = $this->em->createQuery(
            'SELECT IDENTITY(g.taker) AS playerId, p.name AS playerName, p.color AS playerColor,
                    SUM(se.score) AS totalTakerScore
             FROM App\Entity\ScoreEntry se
             JOIN se.game g
             JOIN g.taker p
             WHERE g.session = :session AND g.status = :status AND se.player = g.taker
             GROUP BY g.taker, p.color, p.name
             ORDER BY totalTakerScore DESC'
        )
            ->setParameter('session', $session)
            ->setParameter('status', GameStatus::Completed)
            ->setMaxResults(1)
            ->getResult();

        if (empty($rows)) {
            return null;
        }

        return [
            'description' => "A inflig\u{00E9} le plus de points aux d\u{00E9}fenseurs",
            'playerColor' => $rows[0]['playerColor'],
            'playerId' => (int) $rows[0]['playerId'],
            'playerName' => $rows[0]['playerName'],
            'title' => 'Le Boucher',
        ];
    }

    /**
     * @return array{description: string, playerColor: string|null, playerId: int, playerName: string, title: string}|null
     */
    private function computeEternelDefenseur(Session $session): ?array
    {
        // Count games as taker per player
        /** @var list<array{count: int|string, playerId: int|string}> $takerRows */
        $takerRows = $this->em->createQuery(
            'SELECT IDENTITY(g.taker) AS playerId, COUNT(g.id) AS count
             FROM App\Entity\Game g
             WHERE g.session = :session AND g.status = :status
             GROUP BY g.taker'
        )
            ->setParameter('session', $session)
            ->setParameter('status', GameStatus::Completed)
            ->getResult();

        /** @var array<int, int> $takerCountMap */
        $takerCountMap = [];
        foreach ($takerRows as $row) {
            $takerCountMap[(int) $row['playerId']] = (int) $row['count'];
        }

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
            'title' => "L'\u{00C9}ternel D\u{00E9}fenseur",
        ];
    }

    /**
     * @return array{description: string, playerColor: string|null, playerId: int, playerName: string, title: string}|null
     */
    private function computeFlambeur(Session $session): ?array
    {
        /** @var list<array{count: int|string, playerColor: string|null, playerId: int|string, playerName: string}> $rows */
        $rows = $this->em->createQuery(
            'SELECT IDENTITY(g.taker) AS playerId, p.name AS playerName, p.color AS playerColor,
                    COUNT(g.id) AS count
             FROM App\Entity\Game g
             JOIN g.taker p
             WHERE g.session = :session AND g.status = :status
                   AND g.contract IN (:contracts)
             GROUP BY g.taker, p.color, p.name
             ORDER BY count DESC'
        )
            ->setParameter('session', $session)
            ->setParameter('status', GameStatus::Completed)
            ->setParameter('contracts', [Contract::GardeSans, Contract::GardeContre])
            ->setMaxResults(1)
            ->getResult();

        if (empty($rows)) {
            return null;
        }

        return [
            'description' => "A tent\u{00E9} le plus de Garde Sans/Contre",
            'playerColor' => $rows[0]['playerColor'],
            'playerId' => (int) $rows[0]['playerId'],
            'playerName' => $rows[0]['playerName'],
            'title' => 'Le Flambeur',
        ];
    }
}
