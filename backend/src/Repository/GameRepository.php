<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\Game;
use App\Entity\Player;
use App\Entity\Session;
use App\Enum\Chelem;
use App\Enum\Contract;
use App\Enum\GameStatus;
use App\Enum\Side;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Game>
 */
final class GameRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Game::class);
    }

    public function countBySessionAndStatus(Session $session, GameStatus $status): int
    {
        return (int) $this->createQueryBuilder('g')
            ->select('COUNT(g.id)')
            ->andWhere('g.session = :session')
            ->andWhere('g.status = :status')
            ->setParameter('session', $session)
            ->setParameter('status', $status)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function countCompletedForSession(Session $session): int
    {
        return $this->countBySessionAndStatus($session, GameStatus::Completed);
    }

    /**
     * @return array<int, int> playerId => count
     */
    public function countTakerGamesPerPlayerForSession(Session $session): array
    {
        /** @var list<array{count: int|string, playerId: int|string}> $results */
        $results = $this->createQueryBuilder('g')
            ->select('IDENTITY(g.taker) AS playerId', 'COUNT(g.id) AS count')
            ->andWhere('g.session = :session')
            ->andWhere('g.status = :status')
            ->setParameter('session', $session)
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('g.taker')
            ->getQuery()
            ->getResult();

        $countMap = [];
        foreach ($results as $row) {
            $countMap[(int) $row['playerId']] = (int) $row['count'];
        }

        return $countMap;
    }

    public function findInProgressForSession(Session $session): ?Game
    {
        return $this->findOneBy([
            'session' => $session,
            'status' => GameStatus::InProgress,
        ]);
    }

    /**
     * @return array{contract: string, count: int}|null
     */
    public function findMostPlayedContractForSession(Session $session): ?array
    {
        /** @var list<array{contract: Contract, count: int|string}> $results */
        $results = $this->createQueryBuilder('g')
            ->select('g.contract AS contract', 'COUNT(g.id) AS count')
            ->andWhere('g.session = :session')
            ->andWhere('g.status = :status')
            ->setParameter('session', $session)
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('g.contract')
            ->orderBy('count', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getResult();

        if (empty($results)) {
            return null;
        }

        return [
            'contract' => $results[0]['contract']->value,
            'count' => (int) $results[0]['count'],
        ];
    }

    /**
     * @param list<Contract> $contracts
     *
     * @return array{count: int, playerColor: string|null, playerId: int, playerName: string}|null
     */
    public function getHighContractTakerCountsForSession(Session $session, array $contracts): ?array
    {
        /** @var list<array{count: int|string, playerColor: string|null, playerId: int|string, playerName: string}> $results */
        $results = $this->createQueryBuilder('g')
            ->select('IDENTITY(g.taker) AS playerId', 'p.name AS playerName', 'p.color AS playerColor', 'COUNT(g.id) AS count')
            ->join('g.taker', 'p')
            ->andWhere('g.session = :session')
            ->andWhere('g.status = :status')
            ->andWhere('g.contract IN (:contracts)')
            ->setParameter('session', $session)
            ->setParameter('status', GameStatus::Completed)
            ->setParameter('contracts', $contracts)
            ->groupBy('g.taker')
            ->addGroupBy('p.name')
            ->addGroupBy('p.color')
            ->orderBy('count', 'DESC')
            ->setMaxResults(1)
            ->getQuery()
            ->getResult();

        if (empty($results)) {
            return null;
        }

        $row = $results[0];

        return [
            'count' => (int) $row['count'],
            'playerColor' => $row['playerColor'],
            'playerId' => (int) $row['playerId'],
            'playerName' => $row['playerName'],
        ];
    }

    public function getMaxCompletedAtForSession(Session $session): ?string
    {
        /** @var string|null $result */
        $result = $this->createQueryBuilder('g')
            ->select('MAX(g.completedAt)')
            ->andWhere('g.session = :session')
            ->andWhere('g.status = :status')
            ->andWhere('g.completedAt IS NOT NULL')
            ->setParameter('session', $session)
            ->setParameter('status', GameStatus::Completed)
            ->getQuery()
            ->getSingleScalarResult();

        return $result;
    }

    public function getMaxPositionForSession(Session $session): int
    {
        return (int) $this->createQueryBuilder('g')
            ->select('MAX(g.position)')
            ->andWhere('g.session = :session')
            ->setParameter('session', $session)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function countByTakerAndStatusAndChelem(Player $player, Chelem $chelem): int
    {
        return (int) $this->createQueryBuilder('g')
            ->select('COUNT(g.id)')
            ->andWhere('g.taker = :player')
            ->andWhere('g.status = :status')
            ->andWhere('g.chelem = :chelem')
            ->setParameter('chelem', $chelem)
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function countByTakerAndStatusAndContract(Player $player, Contract $contract): int
    {
        return (int) $this->createQueryBuilder('g')
            ->select('COUNT(g.id)')
            ->andWhere('g.taker = :player')
            ->andWhere('g.status = :status')
            ->andWhere('g.contract = :contract')
            ->setParameter('contract', $contract)
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function countWonGamesWithContract(Player $player, Contract $contract): int
    {
        return (int) $this->createQueryBuilder('g')
            ->select('COUNT(g.id)')
            ->join('g.scoreEntries', 'se')
            ->andWhere('g.taker = :player')
            ->andWhere('g.status = :status')
            ->andWhere('g.contract = :contract')
            ->andWhere('se.player = :player')
            ->andWhere('se.score > 0')
            ->setParameter('contract', $contract)
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->getQuery()
            ->getSingleScalarResult();
    }

    public function countWonGamesWithPetitAuBout(Player $player, Side $side): int
    {
        return (int) $this->createQueryBuilder('g')
            ->select('COUNT(g.id)')
            ->join('g.scoreEntries', 'se')
            ->andWhere('g.taker = :player')
            ->andWhere('g.status = :status')
            ->andWhere('g.petitAuBout = :petitAuBout')
            ->andWhere('se.player = :player')
            ->andWhere('se.score > 0')
            ->setParameter('petitAuBout', $side)
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->getQuery()
            ->getSingleScalarResult();
    }

    /**
     * @return list<int>
     */
    public function getMarathonSessionsForPlayer(Player $player, int $thresholdSeconds): array
    {
        /** @var list<array{sessionId: int|string}> $results */
        $results = $this->createQueryBuilder('g')
            ->select('IDENTITY(g.session) AS sessionId')
            ->join('g.session', 's')
            ->join('s.players', 'p')
            ->andWhere('p = :player')
            ->andWhere('g.status = :status')
            ->andWhere('g.completedAt IS NOT NULL')
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('g.session')
            ->having('MAX(TIMESTAMPDIFF(SECOND, s.createdAt, g.completedAt)) > :threshold')
            ->setParameter('threshold', $thresholdSeconds)
            ->getQuery()
            ->getResult();

        return \array_map(static fn (array $row): int => (int) $row['sessionId'], $results);
    }

    /**
     * @return list<int>
     */
    public function getTakerScoresForPlayer(Player $player): array
    {
        /** @var list<array{score: int|string}> $results */
        $results = $this->createQueryBuilder('g')
            ->select('se.score')
            ->join('g.scoreEntries', 'se')
            ->andWhere('g.taker = :player')
            ->andWhere('g.status = :status')
            ->andWhere('se.player = :player')
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->orderBy('g.createdAt', 'ASC')
            ->getQuery()
            ->getResult();

        return \array_map(static fn (array $row): int => (int) $row['score'], $results);
    }

    /**
     * @return list<array{contract: Contract, count: int|string}>
     */
    public function getContractDistribution(?int $playerGroupId = null): array
    {
        $qb = $this->createQueryBuilder('g')
            ->select('g.contract AS contract', 'COUNT(g.id) AS count')
            ->andWhere('g.status = :status')
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('g.contract')
            ->orderBy('count', 'DESC');

        $this->applyGroupFilter($qb, $playerGroupId);

        /** @var list<array{contract: Contract, count: int|string}> $result */
        $result = $qb->getQuery()->getResult();

        return $result;
    }

    /**
     * @return list<array{contract: Contract, count: int|string, playerColor: string|null, playerId: int|string, playerName: string}>
     */
    public function getContractCountByPlayer(?int $playerGroupId = null): array
    {
        $qb = $this->createQueryBuilder('g')
            ->select('IDENTITY(g.taker) AS playerId', 'p.name AS playerName', 'p.color AS playerColor', 'g.contract AS contract', 'COUNT(g.id) AS count')
            ->join('g.taker', 'p')
            ->andWhere('g.status = :status')
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('g.taker')
            ->addGroupBy('p.color')
            ->addGroupBy('p.name')
            ->addGroupBy('g.contract');

        $this->applyGroupFilter($qb, $playerGroupId);

        /** @var list<array{contract: Contract, count: int|string, playerColor: string|null, playerId: int|string, playerName: string}> $result */
        $result = $qb->getQuery()->getResult();

        return $result;
    }

    /**
     * @return list<array{contract: Contract, playerId: int|string, wins: int|string}>
     */
    public function getContractWinsByPlayer(?int $playerGroupId = null): array
    {
        $qb = $this->createQueryBuilder('g')
            ->select('IDENTITY(g.taker) AS playerId', 'g.contract AS contract', 'COUNT(g.id) AS wins')
            ->join('App\Entity\ScoreEntry', 'se', 'WITH', 'se.game = g AND se.player = g.taker')
            ->andWhere('g.status = :status')
            ->andWhere('se.score > 0')
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('g.taker')
            ->addGroupBy('g.contract');

        $this->applyGroupFilter($qb, $playerGroupId);

        /** @var list<array{contract: Contract, playerId: int|string, wins: int|string}> $result */
        $result = $qb->getQuery()->getResult();

        return $result;
    }

    public function countCompleted(?int $playerGroupId = null): int
    {
        $qb = $this->createQueryBuilder('g')
            ->select('COUNT(g.id)')
            ->andWhere('g.status = :status')
            ->setParameter('status', GameStatus::Completed);

        $this->applyGroupFilter($qb, $playerGroupId);

        return (int) $qb->getQuery()->getSingleScalarResult();
    }

    public function getAverageDurationSeconds(?int $playerGroupId = null): ?int
    {
        $qb = $this->createQueryBuilder('g')
            ->select('AVG(TIMESTAMPDIFF(SECOND, g.createdAt, g.completedAt))')
            ->andWhere('g.status = :status')
            ->andWhere('g.completedAt IS NOT NULL')
            ->setParameter('status', GameStatus::Completed);

        $this->applyGroupFilter($qb, $playerGroupId);

        /** @var string|null $avg */
        $avg = $qb->getQuery()->getSingleScalarResult();

        return null !== $avg ? (int) \round((float) $avg) : null;
    }

    public function getTotalDurationSeconds(?int $playerGroupId = null): int
    {
        $qb = $this->createQueryBuilder('g')
            ->select('SUM(TIMESTAMPDIFF(SECOND, g.createdAt, g.completedAt))')
            ->andWhere('g.status = :status')
            ->andWhere('g.completedAt IS NOT NULL')
            ->setParameter('status', GameStatus::Completed);

        $this->applyGroupFilter($qb, $playerGroupId);

        /** @var string|null $total */
        $total = $qb->getQuery()->getSingleScalarResult();

        return (int) ($total ?? 0);
    }

    /**
     * @return list<array{gamesAsTaker: int|string, playerId: int|string}>
     */
    public function countTakerGames(?int $playerGroupId = null): array
    {
        $qb = $this->createQueryBuilder('g')
            ->select('IDENTITY(g.taker) AS playerId', 'COUNT(g.id) AS gamesAsTaker')
            ->andWhere('g.status = :status')
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('g.taker');

        $this->applyGroupFilter($qb, $playerGroupId);

        /** @var list<array{gamesAsTaker: int|string, playerId: int|string}> $result */
        $result = $qb->getQuery()->getResult();

        return $result;
    }

    /**
     * @return list<array{playerId: int|string, wins: int|string}>
     */
    public function countTakerWins(?int $playerGroupId = null): array
    {
        $qb = $this->createQueryBuilder('g')
            ->select('IDENTITY(g.taker) AS playerId', 'COUNT(g.id) AS wins')
            ->join('App\Entity\ScoreEntry', 'se', 'WITH', 'se.game = g AND se.player = g.taker')
            ->andWhere('g.status = :status')
            ->andWhere('se.score > 0')
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('g.taker');

        $this->applyGroupFilter($qb, $playerGroupId);

        /** @var list<array{playerId: int|string, wins: int|string}> $result */
        $result = $qb->getQuery()->getResult();

        return $result;
    }

    public function countPlayerGamesAsTaker(Player $player, ?int $playerGroupId = null): int
    {
        $qb = $this->createQueryBuilder('g')
            ->select('COUNT(g.id)')
            ->andWhere('g.taker = :player')
            ->andWhere('g.status = :status')
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed);

        $this->applyGroupFilter($qb, $playerGroupId);

        return (int) $qb->getQuery()->getSingleScalarResult();
    }

    public function countPlayerGamesAsPartner(Player $player, ?int $playerGroupId = null): int
    {
        $qb = $this->createQueryBuilder('g')
            ->select('COUNT(g.id)')
            ->andWhere('g.partner = :player')
            ->andWhere('g.status = :status')
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed);

        $this->applyGroupFilter($qb, $playerGroupId);

        return (int) $qb->getQuery()->getSingleScalarResult();
    }

    public function countPlayerWinsAsTaker(Player $player, ?int $playerGroupId = null): int
    {
        $qb = $this->createQueryBuilder('g')
            ->select('COUNT(g.id)')
            ->join('App\Entity\ScoreEntry', 'se', 'WITH', 'se.game = g AND se.player = g.taker')
            ->andWhere('g.taker = :player')
            ->andWhere('g.status = :status')
            ->andWhere('se.score > 0')
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed);

        $this->applyGroupFilter($qb, $playerGroupId);

        return (int) $qb->getQuery()->getSingleScalarResult();
    }

    public function countPlayerDistinctSessions(Player $player, ?int $playerGroupId = null): int
    {
        $qb = $this->createQueryBuilder('g')
            ->select('COUNT(DISTINCT g.session)')
            ->join('App\Entity\ScoreEntry', 'se', 'WITH', 'se.game = g AND se.player = :player')
            ->andWhere('g.status = :status')
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed);

        $this->applyGroupFilter($qb, $playerGroupId);

        return (int) $qb->getQuery()->getSingleScalarResult();
    }

    /**
     * @return list<array{contract: Contract, count: int}>
     */
    public function getPlayerContractDistribution(Player $player, ?int $playerGroupId = null): array
    {
        $qb = $this->createQueryBuilder('g')
            ->select('g.contract AS contract', 'COUNT(g.id) AS count')
            ->andWhere('g.taker = :player')
            ->andWhere('g.status = :status')
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('g.contract');

        $this->applyGroupFilter($qb, $playerGroupId);

        /** @var list<array{contract: Contract, count: int|string}> $results */
        $results = $qb->getQuery()->getResult();

        return \array_map(static fn (array $row) => [
            'contract' => $row['contract'],
            'count' => (int) $row['count'],
        ], $results);
    }

    /**
     * @return list<array{contract: Contract, wins: int}>
     */
    public function getPlayerContractWins(Player $player, ?int $playerGroupId = null): array
    {
        $qb = $this->createQueryBuilder('g')
            ->select('g.contract AS contract', 'COUNT(g.id) AS wins')
            ->join('App\Entity\ScoreEntry', 'se', 'WITH', 'se.game = g AND se.player = g.taker')
            ->andWhere('g.taker = :player')
            ->andWhere('g.status = :status')
            ->andWhere('se.score > 0')
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('g.contract');

        $this->applyGroupFilter($qb, $playerGroupId);

        /** @var list<array{contract: Contract, wins: int|string}> $results */
        $results = $qb->getQuery()->getResult();

        return \array_map(static fn (array $row) => [
            'contract' => $row['contract'],
            'wins' => (int) $row['wins'],
        ], $results);
    }

    /**
     * @return list<array{contract: Contract, date: \DateTimeImmutable, oudlers: int|null, points: float|null, score: int, sessionId: int}>
     */
    public function getPlayerTakerGamesForRecords(Player $player, ?int $playerGroupId = null): array
    {
        $qb = $this->createQueryBuilder('g')
            ->select('se.score', 'g.createdAt AS date', 'IDENTITY(g.session) AS sessionId', 'g.contract AS contract', 'g.points AS points', 'g.oudlers AS oudlers')
            ->join('App\Entity\ScoreEntry', 'se', 'WITH', 'se.game = g AND se.player = g.taker')
            ->andWhere('g.taker = :player')
            ->andWhere('g.status = :status')
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->orderBy('g.createdAt', 'ASC');

        $this->applyGroupFilter($qb, $playerGroupId);

        /** @var list<array{contract: Contract, date: \DateTimeImmutable, oudlers: int|null, points: float|null, score: int|string, sessionId: int|string}> $results */
        $results = $qb->getQuery()->getResult();

        return \array_map(static fn (array $row) => [
            'contract' => $row['contract'],
            'date' => $row['date'],
            'oudlers' => $row['oudlers'],
            'points' => $row['points'],
            'score' => (int) $row['score'],
            'sessionId' => (int) $row['sessionId'],
        ], $results);
    }

    /**
     * @return array{averageGameDurationSeconds: int|null, totalPlayTimeSeconds: int}
     */
    public function getPlayerDurationStats(Player $player, ?int $playerGroupId = null): array
    {
        $qb = $this->createQueryBuilder('g')
            ->select('AVG(TIMESTAMPDIFF(SECOND, g.createdAt, g.completedAt)) AS avg', 'SUM(TIMESTAMPDIFF(SECOND, g.createdAt, g.completedAt)) AS total')
            ->join('App\Entity\ScoreEntry', 'se', 'WITH', 'se.game = g AND se.player = :player')
            ->andWhere('g.status = :status')
            ->andWhere('g.completedAt IS NOT NULL')
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed);

        $this->applyGroupFilter($qb, $playerGroupId);

        /** @var array{avg: string|null, total: string|null} $result */
        $result = $qb->getQuery()->getSingleResult();

        return [
            'averageGameDurationSeconds' => null !== $result['avg'] ? (int) \round((float) $result['avg']) : null,
            'totalPlayTimeSeconds' => (int) ($result['total'] ?? 0),
        ];
    }

    private function applyGroupFilter(\Doctrine\ORM\QueryBuilder $qb, ?int $playerGroupId, string $gameAlias = 'g'): void
    {
        if (null !== $playerGroupId) {
            $qb->join($gameAlias.'.session', 's_grp')
               ->andWhere('s_grp.playerGroup = :group')
               ->setParameter('group', $playerGroupId);
        }
    }
}
