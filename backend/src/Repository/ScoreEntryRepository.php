<?php

declare(strict_types=1);

namespace App\Repository;

use App\Entity\ScoreEntry;
use App\Entity\Session;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<ScoreEntry>
 */
final class ScoreEntryRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, ScoreEntry::class);
    }

    /**
     * @return array<array{playerId: int, playerName: string, score: int}>
     */
    public function getCumulativeScoresForSession(Session $session): array
    {
        /** @var list<array{playerId: int|string, playerName: string, totalScore: string}> $results */
        $results = $this->createQueryBuilder('se')
            ->select('IDENTITY(se.player) AS playerId', 'p.name AS playerName', 'SUM(se.score) AS totalScore')
            ->leftJoin('se.game', 'g')
            ->join('se.player', 'p')
            ->andWhere('g.session = :session OR (se.game IS NULL AND se.session = :session)')
            ->setParameter('session', $session)
            ->groupBy('se.player')
            ->addGroupBy('p.name')
            ->orderBy('p.name', 'ASC')
            ->getQuery()
            ->getResult();

        return array_map(static fn (array $row) => [
            'playerId' => $row['playerId'],
            'playerName' => $row['playerName'],
            'score' => (int) $row['totalScore'],
        ], $results);
    }
}
