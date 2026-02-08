<?php

declare(strict_types=1);

namespace App\Service;

use App\Entity\Player;
use App\Enum\Contract;
use App\Enum\GameStatus;
use Doctrine\ORM\EntityManagerInterface;

class StatisticsService
{
    public function __construct(
        private readonly EntityManagerInterface $em,
    ) {
    }

    /**
     * @return list<array{contract: string, count: int, percentage: float}>
     */
    public function getContractDistribution(): array
    {
        $total = $this->getTotalGames();
        if (0 === $total) {
            return [];
        }

        /** @var list<array{contract: Contract, count: int|string}> $rows */
        $rows = $this->em->createQuery(
            'SELECT g.contract AS contract, COUNT(g.id) AS count
             FROM App\Entity\Game g
             WHERE g.status = :status
             GROUP BY g.contract
             ORDER BY count DESC'
        )
            ->setParameter('status', GameStatus::Completed)
            ->getResult();

        return \array_map(
            static fn (array $row) => [
                'contract' => $row['contract']->value,
                'count' => (int) $row['count'],
                'percentage' => \round((int) $row['count'] / $total * 100, 2),
            ],
            $rows,
        );
    }

    /**
     * @return list<array{gamesAsTaker: int, gamesPlayed: int, playerId: int, playerName: string, totalScore: int, winRate: float, wins: int}>
     */
    public function getLeaderboard(): array
    {
        /** @var list<array{playerId: int|string, playerName: string, totalScore: int|string}> $scoreRows */
        $scoreRows = $this->em->createQuery(
            'SELECT IDENTITY(se.player) AS playerId, p.name AS playerName, SUM(se.score) AS totalScore
             FROM App\Entity\ScoreEntry se
             JOIN se.player p
             LEFT JOIN se.game g
             WHERE (g IS NOT NULL AND g.status = :status) OR se.game IS NULL
             GROUP BY se.player, p.name
             ORDER BY totalScore DESC'
        )
            ->setParameter('status', GameStatus::Completed)
            ->getResult();

        if (empty($scoreRows)) {
            return [];
        }

        /** @var list<array{gamesPlayed: int|string, playerId: int|string}> $gamesPlayedRows */
        $gamesPlayedRows = $this->em->createQuery(
            'SELECT IDENTITY(se.player) AS playerId, COUNT(DISTINCT se.game) AS gamesPlayed
             FROM App\Entity\ScoreEntry se
             JOIN se.game g
             WHERE g.status = :status
             GROUP BY se.player'
        )
            ->setParameter('status', GameStatus::Completed)
            ->getResult();

        /** @var array<int, int> $gamesPlayed */
        $gamesPlayed = [];
        foreach ($gamesPlayedRows as $row) {
            $gamesPlayed[(int) $row['playerId']] = (int) $row['gamesPlayed'];
        }

        /** @var list<array{gamesAsTaker: int|string, playerId: int|string}> $takerRows */
        $takerRows = $this->em->createQuery(
            'SELECT IDENTITY(g.taker) AS playerId, COUNT(g.id) AS gamesAsTaker
             FROM App\Entity\Game g
             WHERE g.status = :status
             GROUP BY g.taker'
        )
            ->setParameter('status', GameStatus::Completed)
            ->getResult();

        /** @var array<int, int> $gamesAsTaker */
        $gamesAsTaker = [];
        foreach ($takerRows as $row) {
            $gamesAsTaker[(int) $row['playerId']] = (int) $row['gamesAsTaker'];
        }

        /** @var list<array{playerId: int|string, wins: int|string}> $winRows */
        $winRows = $this->em->createQuery(
            'SELECT IDENTITY(g.taker) AS playerId, COUNT(g.id) AS wins
             FROM App\Entity\Game g
             JOIN App\Entity\ScoreEntry se WITH se.game = g AND se.player = g.taker
             WHERE g.status = :status AND se.score > 0
             GROUP BY g.taker'
        )
            ->setParameter('status', GameStatus::Completed)
            ->getResult();

        /** @var array<int, int> $wins */
        $wins = [];
        foreach ($winRows as $row) {
            $wins[(int) $row['playerId']] = (int) $row['wins'];
        }

        return \array_map(
            static fn (array $row) => [
                'gamesAsTaker' => $gamesAsTaker[(int) $row['playerId']] ?? 0,
                'gamesPlayed' => $gamesPlayed[(int) $row['playerId']] ?? 0,
                'playerId' => (int) $row['playerId'],
                'playerName' => $row['playerName'],
                'totalScore' => (int) $row['totalScore'],
                'winRate' => ($gamesAsTaker[(int) $row['playerId']] ?? 0) > 0
                    ? \round(($wins[(int) $row['playerId']] ?? 0) / $gamesAsTaker[(int) $row['playerId']] * 100, 1)
                    : 0.0,
                'wins' => $wins[(int) $row['playerId']] ?? 0,
            ],
            $scoreRows,
        );
    }

    /**
     * @return array{averageScore: float, bestGameScore: int, contractDistribution: list<array{contract: string, count: int, winRate: float, wins: int}>, gamesAsDefender: int, gamesAsPartner: int, gamesAsTaker: int, gamesPlayed: int, player: array{id: int|null, name: string}, recentScores: list<array{date: string, gameId: int, score: int, sessionId: int}>, sessionsPlayed: int, starPenalties: int, totalStars: int, winRateAsTaker: float, worstGameScore: int}
     */
    public function getPlayerStats(Player $player): array
    {
        $playerId = $player->getId();

        /** @var array{averageScore: float|string|null, bestGameScore: int|string|null, gamesPlayed: int|string, totalScore: int|string|null, worstGameScore: int|string|null} $scoreAgg */
        $scoreAgg = $this->em->createQuery(
            'SELECT COUNT(se.id) AS gamesPlayed, SUM(se.score) AS totalScore,
                    AVG(se.score) AS averageScore, MAX(se.score) AS bestGameScore, MIN(se.score) AS worstGameScore
             FROM App\Entity\ScoreEntry se
             JOIN se.game g
             WHERE se.player = :player AND g.status = :status'
        )
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->getSingleResult();

        $gamesPlayed = (int) $scoreAgg['gamesPlayed'];

        $gamesAsTaker = (int) $this->em->createQuery(
            'SELECT COUNT(g.id)
             FROM App\Entity\Game g
             WHERE g.taker = :player AND g.status = :status'
        )
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->getSingleScalarResult();

        $gamesAsPartner = (int) $this->em->createQuery(
            'SELECT COUNT(g.id)
             FROM App\Entity\Game g
             WHERE g.partner = :player AND g.status = :status'
        )
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->getSingleScalarResult();

        $gamesAsDefender = $gamesPlayed - $gamesAsTaker - $gamesAsPartner;

        $winsAsTaker = (int) $this->em->createQuery(
            'SELECT COUNT(g.id)
             FROM App\Entity\Game g
             JOIN App\Entity\ScoreEntry se WITH se.game = g AND se.player = g.taker
             WHERE g.taker = :player AND g.status = :status AND se.score > 0'
        )
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->getSingleScalarResult();

        $sessionsPlayed = (int) $this->em->createQuery(
            'SELECT COUNT(DISTINCT g.session)
             FROM App\Entity\Game g
             JOIN App\Entity\ScoreEntry se WITH se.game = g AND se.player = :player
             WHERE g.status = :status'
        )
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->getSingleScalarResult();

        /** @var list<array{contract: Contract, count: int|string}> $contractRows */
        $contractRows = $this->em->createQuery(
            'SELECT g.contract AS contract, COUNT(g.id) AS count
             FROM App\Entity\Game g
             WHERE g.taker = :player AND g.status = :status
             GROUP BY g.contract'
        )
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->getResult();

        /** @var list<array{contract: Contract, wins: int|string}> $contractWinRows */
        $contractWinRows = $this->em->createQuery(
            'SELECT g.contract AS contract, COUNT(g.id) AS wins
             FROM App\Entity\Game g
             JOIN App\Entity\ScoreEntry se WITH se.game = g AND se.player = g.taker
             WHERE g.taker = :player AND g.status = :status AND se.score > 0
             GROUP BY g.contract'
        )
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->getResult();

        /** @var array<string, int> $contractWins */
        $contractWins = [];
        foreach ($contractWinRows as $row) {
            $contractWins[$row['contract']->value] = (int) $row['wins'];
        }

        $contractDistribution = \array_map(
            static fn (array $row) => [
                'contract' => $row['contract']->value,
                'count' => (int) $row['count'],
                'winRate' => (int) $row['count'] > 0
                    ? \round(($contractWins[$row['contract']->value] ?? 0) / (int) $row['count'] * 100, 1)
                    : 0.0,
                'wins' => $contractWins[$row['contract']->value] ?? 0,
            ],
            $contractRows,
        );

        /** @var list<array{date: \DateTimeImmutable, gameId: int|string, score: int|string, sessionId: int|string}> $recentScores */
        $recentScores = $this->em->createQuery(
            'SELECT se.score AS score, g.id AS gameId, g.createdAt AS date, IDENTITY(g.session) AS sessionId
             FROM App\Entity\ScoreEntry se
             JOIN se.game g
             WHERE se.player = :player AND g.status = :status
             ORDER BY g.createdAt DESC'
        )
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->setMaxResults(50)
            ->getResult();

        $formattedRecentScores = \array_map(
            static fn (array $row) => [
                'date' => $row['date']->format(\DateTimeInterface::ATOM),
                'gameId' => (int) $row['gameId'],
                'score' => (int) $row['score'],
                'sessionId' => (int) $row['sessionId'],
            ],
            $recentScores,
        );

        $totalStars = (int) $this->em->createQuery(
            'SELECT COUNT(se.id) FROM App\Entity\StarEvent se WHERE se.player = :player'
        )
            ->setParameter('player', $player)
            ->getSingleScalarResult();

        $starPenalties = (int) \floor($totalStars / 3);

        return [
            'averageScore' => null !== $scoreAgg['averageScore'] ? \round((float) $scoreAgg['averageScore'], 1) : 0.0,
            'bestGameScore' => (int) ($scoreAgg['bestGameScore'] ?? 0),
            'contractDistribution' => $contractDistribution,
            'gamesAsDefender' => $gamesAsDefender,
            'gamesAsPartner' => $gamesAsPartner,
            'gamesAsTaker' => $gamesAsTaker,
            'gamesPlayed' => $gamesPlayed,
            'player' => ['id' => $playerId, 'name' => $player->getName()],
            'recentScores' => $formattedRecentScores,
            'sessionsPlayed' => $sessionsPlayed,
            'starPenalties' => $starPenalties,
            'totalStars' => $totalStars,
            'winRateAsTaker' => $gamesAsTaker > 0 ? \round($winsAsTaker / $gamesAsTaker * 100, 1) : 0.0,
            'worstGameScore' => (int) ($scoreAgg['worstGameScore'] ?? 0),
        ];
    }

    public function getTotalStars(): int
    {
        return (int) $this->em->createQuery(
            'SELECT COUNT(se.id) FROM App\Entity\StarEvent se'
        )
            ->getSingleScalarResult();
    }

    public function getTotalGames(): int
    {
        return (int) $this->em->createQuery(
            'SELECT COUNT(g.id) FROM App\Entity\Game g WHERE g.status = :status'
        )
            ->setParameter('status', GameStatus::Completed)
            ->getSingleScalarResult();
    }

    public function getTotalSessions(): int
    {
        return (int) $this->em->createQuery(
            'SELECT COUNT(s.id) FROM App\Entity\Session s'
        )
            ->getSingleScalarResult();
    }
}
