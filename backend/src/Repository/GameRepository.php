<?php

declare(strict_types=1);

namespace App\Repository;

use App\Dto\ContractCountByPlayerDto;
use App\Dto\ContractDistributionDto;
use App\Dto\ContractWinsByPlayerDto;
use App\Dto\ContractWinsDto;
use App\Dto\PlayerCountDto;
use App\Dto\PlayerWithCountDto;
use App\Dto\TakerGameRecordDto;
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
    use GroupFilterTrait;

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

    public function findMostPlayedContractForSession(Session $session): ?ContractDistributionDto
    {
        $qb = $this->createQueryBuilder('g')
            ->select('NEW App\Dto\ContractDistributionDto(g.contract, COUNT(g.id))')
            ->andWhere('g.session = :session')
            ->andWhere('g.status = :status')
            ->setParameter('session', $session)
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('g.contract')
            ->orderBy('COUNT(g.id)', 'DESC')
            ->setMaxResults(1);

        /** @var list<ContractDistributionDto> $results */
        $results = $qb->getQuery()->getResult();

        return $results[0] ?? null;
    }

    /**
     * @param list<Contract> $contracts
     */
    public function getHighContractTakerCountsForSession(Session $session, array $contracts): ?PlayerWithCountDto
    {
        $qb = $this->createQueryBuilder('g')
            ->select('NEW App\Dto\PlayerWithCountDto(COUNT(g.id), p.color, IDENTITY(g.taker), p.name)')
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
            ->orderBy('COUNT(g.id)', 'DESC')
            ->setMaxResults(1);

        /** @var list<PlayerWithCountDto> $results */
        $results = $qb->getQuery()->getResult();

        return $results[0] ?? null;
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

    public function getMaxCreatedAtForSession(Session $session): ?\DateTimeImmutable
    {
        /** @var string|null $result */
        $result = $this->createQueryBuilder('g')
            ->select('MAX(g.createdAt)')
            ->andWhere('g.session = :session')
            ->setParameter('session', $session)
            ->getQuery()
            ->getSingleScalarResult();

        return null !== $result ? new \DateTimeImmutable($result) : null;
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
     * @param list<int> $playerIds
     *
     * @return array<int, int> playerId => count
     */
    public function countByTakerAndChelemForPlayers(array $playerIds, Chelem $chelem): array
    {
        if ([] === $playerIds) {
            return [];
        }

        /** @var list<array{count: int|string, playerId: int|string}> $results */
        $results = $this->createQueryBuilder('g')
            ->select('IDENTITY(g.taker) AS playerId', 'COUNT(g.id) AS count')
            ->andWhere('g.taker IN (:playerIds)')
            ->andWhere('g.status = :status')
            ->andWhere('g.chelem = :chelem')
            ->setParameter('chelem', $chelem)
            ->setParameter('playerIds', $playerIds)
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('g.taker')
            ->getQuery()
            ->getResult();

        $map = \array_fill_keys($playerIds, 0);
        foreach ($results as $row) {
            $map[(int) $row['playerId']] = (int) $row['count'];
        }

        return $map;
    }

    /**
     * @param list<int> $playerIds
     *
     * @return array<int, int> playerId => count
     */
    public function countByTakerAndContractForPlayers(array $playerIds, Contract $contract): array
    {
        if ([] === $playerIds) {
            return [];
        }

        /** @var list<array{count: int|string, playerId: int|string}> $results */
        $results = $this->createQueryBuilder('g')
            ->select('IDENTITY(g.taker) AS playerId', 'COUNT(g.id) AS count')
            ->andWhere('g.taker IN (:playerIds)')
            ->andWhere('g.status = :status')
            ->andWhere('g.contract = :contract')
            ->setParameter('contract', $contract)
            ->setParameter('playerIds', $playerIds)
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('g.taker')
            ->getQuery()
            ->getResult();

        $map = \array_fill_keys($playerIds, 0);
        foreach ($results as $row) {
            $map[(int) $row['playerId']] = (int) $row['count'];
        }

        return $map;
    }

    /**
     * @param list<int> $playerIds
     *
     * @return array<int, int> playerId => count
     */
    public function countWonGamesWithContractForPlayers(array $playerIds, Contract $contract): array
    {
        if ([] === $playerIds) {
            return [];
        }

        /** @var list<array{count: int|string, playerId: int|string}> $results */
        $results = $this->createQueryBuilder('g')
            ->select('IDENTITY(g.taker) AS playerId', 'COUNT(g.id) AS count')
            ->join('g.scoreEntries', 'se')
            ->andWhere('g.taker IN (:playerIds)')
            ->andWhere('g.status = :status')
            ->andWhere('g.contract = :contract')
            ->andWhere('se.player = g.taker')
            ->andWhere('se.score > 0')
            ->setParameter('contract', $contract)
            ->setParameter('playerIds', $playerIds)
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('g.taker')
            ->getQuery()
            ->getResult();

        $map = \array_fill_keys($playerIds, 0);
        foreach ($results as $row) {
            $map[(int) $row['playerId']] = (int) $row['count'];
        }

        return $map;
    }

    /**
     * @param list<int> $playerIds
     *
     * @return array<int, int> playerId => count
     */
    public function countWonGamesWithPetitAuBoutForPlayers(array $playerIds, Side $side): array
    {
        if ([] === $playerIds) {
            return [];
        }

        /** @var list<array{count: int|string, playerId: int|string}> $results */
        $results = $this->createQueryBuilder('g')
            ->select('IDENTITY(g.taker) AS playerId', 'COUNT(g.id) AS count')
            ->join('g.scoreEntries', 'se')
            ->andWhere('g.taker IN (:playerIds)')
            ->andWhere('g.status = :status')
            ->andWhere('g.petitAuBout = :petitAuBout')
            ->andWhere('se.player = g.taker')
            ->andWhere('se.score > 0')
            ->setParameter('petitAuBout', $side)
            ->setParameter('playerIds', $playerIds)
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('g.taker')
            ->getQuery()
            ->getResult();

        $map = \array_fill_keys($playerIds, 0);
        foreach ($results as $row) {
            $map[(int) $row['playerId']] = (int) $row['count'];
        }

        return $map;
    }

    /**
     * @param list<int> $playerIds
     *
     * @return array<int, list<int>> playerId => list of marathon session IDs
     */
    public function getMarathonSessionsForPlayers(array $playerIds, int $thresholdSeconds): array
    {
        if ([] === $playerIds) {
            return [];
        }

        /** @var list<array{playerId: int|string, sessionId: int|string}> $results */
        $results = $this->createQueryBuilder('g')
            ->select('p.id AS playerId', 'IDENTITY(g.session) AS sessionId')
            ->join('g.session', 's')
            ->join('s.players', 'p')
            ->andWhere('p.id IN (:playerIds)')
            ->andWhere('g.status = :status')
            ->andWhere('g.completedAt IS NOT NULL')
            ->setParameter('playerIds', $playerIds)
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('p.id')
            ->addGroupBy('g.session')
            ->having('MAX(TIMESTAMPDIFF(SECOND, s.createdAt, g.completedAt)) > :threshold')
            ->setParameter('threshold', $thresholdSeconds)
            ->getQuery()
            ->getResult();

        $map = \array_fill_keys($playerIds, []);
        foreach ($results as $row) {
            $map[(int) $row['playerId']][] = (int) $row['sessionId'];
        }

        return $map;
    }

    /**
     * @param list<int> $playerIds
     *
     * @return array<int, list<int>> playerId => list of taker scores
     */
    public function getTakerScoresForPlayers(array $playerIds): array
    {
        if ([] === $playerIds) {
            return [];
        }

        /** @var list<array{playerId: int|string, score: int|string}> $results */
        $results = $this->createQueryBuilder('g')
            ->select('IDENTITY(g.taker) AS playerId', 'se.score')
            ->join('g.scoreEntries', 'se')
            ->andWhere('g.taker IN (:playerIds)')
            ->andWhere('g.status = :status')
            ->andWhere('se.player = g.taker')
            ->setParameter('playerIds', $playerIds)
            ->setParameter('status', GameStatus::Completed)
            ->orderBy('g.createdAt', 'ASC')
            ->getQuery()
            ->getResult();

        $map = \array_fill_keys($playerIds, []);
        foreach ($results as $row) {
            $map[(int) $row['playerId']][] = (int) $row['score'];
        }

        return $map;
    }

    /**
     * @return list<ContractDistributionDto>
     */
    public function getContractDistribution(?int $playerGroupId = null): array
    {
        $qb = $this->createQueryBuilder('g')
            ->select('NEW App\Dto\ContractDistributionDto(g.contract, COUNT(g.id))')
            ->andWhere('g.status = :status')
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('g.contract')
            ->orderBy('COUNT(g.id)', 'DESC');

        $this->applyGroupFilter($qb, $playerGroupId);

        /** @var list<ContractDistributionDto> */
        return $qb->getQuery()->getResult();
    }

    /**
     * @return list<ContractCountByPlayerDto>
     */
    public function getContractCountByPlayer(?int $playerGroupId = null): array
    {
        $qb = $this->createQueryBuilder('g')
            ->select('NEW App\Dto\ContractCountByPlayerDto(g.contract, COUNT(g.id), p.color, IDENTITY(g.taker), p.name)')
            ->join('g.taker', 'p')
            ->andWhere('g.status = :status')
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('g.taker')
            ->addGroupBy('p.color')
            ->addGroupBy('p.name')
            ->addGroupBy('g.contract');

        $this->applyGroupFilter($qb, $playerGroupId);

        /** @var list<ContractCountByPlayerDto> */
        return $qb->getQuery()->getResult();
    }

    /**
     * @return list<ContractWinsByPlayerDto>
     */
    public function getContractWinsByPlayer(?int $playerGroupId = null): array
    {
        $qb = $this->createQueryBuilder('g')
            ->select('NEW App\Dto\ContractWinsByPlayerDto(g.contract, IDENTITY(g.taker), COUNT(g.id))')
            ->join('App\Entity\ScoreEntry', 'se', 'WITH', 'se.game = g AND se.player = g.taker')
            ->andWhere('g.status = :status')
            ->andWhere('se.score > 0')
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('g.taker')
            ->addGroupBy('g.contract');

        $this->applyGroupFilter($qb, $playerGroupId);

        /** @var list<ContractWinsByPlayerDto> */
        return $qb->getQuery()->getResult();
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
     * @return list<PlayerCountDto>
     */
    public function countTakerGames(?int $playerGroupId = null): array
    {
        $qb = $this->createQueryBuilder('g')
            ->select('NEW App\Dto\PlayerCountDto(COUNT(g.id), IDENTITY(g.taker))')
            ->andWhere('g.status = :status')
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('g.taker');

        $this->applyGroupFilter($qb, $playerGroupId);

        /** @var list<PlayerCountDto> */
        return $qb->getQuery()->getResult();
    }

    /**
     * @return list<PlayerCountDto>
     */
    public function countTakerWins(?int $playerGroupId = null): array
    {
        $qb = $this->createQueryBuilder('g')
            ->select('NEW App\Dto\PlayerCountDto(COUNT(g.id), IDENTITY(g.taker))')
            ->join('App\Entity\ScoreEntry', 'se', 'WITH', 'se.game = g AND se.player = g.taker')
            ->andWhere('g.status = :status')
            ->andWhere('se.score > 0')
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('g.taker');

        $this->applyGroupFilter($qb, $playerGroupId);

        /** @var list<PlayerCountDto> */
        return $qb->getQuery()->getResult();
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
     * @return list<ContractDistributionDto>
     */
    public function getPlayerContractDistribution(Player $player, ?int $playerGroupId = null): array
    {
        $qb = $this->createQueryBuilder('g')
            ->select('NEW App\Dto\ContractDistributionDto(g.contract, COUNT(g.id))')
            ->andWhere('g.taker = :player')
            ->andWhere('g.status = :status')
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('g.contract');

        $this->applyGroupFilter($qb, $playerGroupId);

        /** @var list<ContractDistributionDto> */
        return $qb->getQuery()->getResult();
    }

    /**
     * @return list<ContractWinsDto>
     */
    public function getPlayerContractWins(Player $player, ?int $playerGroupId = null): array
    {
        $qb = $this->createQueryBuilder('g')
            ->select('NEW App\Dto\ContractWinsDto(g.contract, COUNT(g.id))')
            ->join('App\Entity\ScoreEntry', 'se', 'WITH', 'se.game = g AND se.player = g.taker')
            ->andWhere('g.taker = :player')
            ->andWhere('g.status = :status')
            ->andWhere('se.score > 0')
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->groupBy('g.contract');

        $this->applyGroupFilter($qb, $playerGroupId);

        /** @var list<ContractWinsDto> */
        return $qb->getQuery()->getResult();
    }

    /**
     * @return list<TakerGameRecordDto>
     */
    public function getPlayerTakerGamesForRecords(Player $player, ?int $playerGroupId = null): array
    {
        $qb = $this->createQueryBuilder('g')
            ->select('NEW App\Dto\TakerGameRecordDto(g.contract, g.createdAt, g.oudlers, g.points, se.score, IDENTITY(g.session))')
            ->join('App\Entity\ScoreEntry', 'se', 'WITH', 'se.game = g AND se.player = g.taker')
            ->andWhere('g.taker = :player')
            ->andWhere('g.status = :status')
            ->setParameter('player', $player)
            ->setParameter('status', GameStatus::Completed)
            ->orderBy('g.createdAt', 'ASC');

        $this->applyGroupFilter($qb, $playerGroupId);

        /** @var list<TakerGameRecordDto> */
        return $qb->getQuery()->getResult();
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
}
