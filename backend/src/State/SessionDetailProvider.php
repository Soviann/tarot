<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Doctrine\Orm\State\ItemProvider;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Entity\Session;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Enrichit le GET item d'une session avec les scores cumulés par joueur.
 *
 * @implements ProviderInterface<Session>
 */
final readonly class SessionDetailProvider implements ProviderInterface
{
    public function __construct(
        private EntityManagerInterface $em,
        private ItemProvider $itemProvider,
    ) {
    }

    public function provide(Operation $operation, array $uriVariables = [], array $context = []): ?Session
    {
        /** @var Session|null $session */
        $session = $this->itemProvider->provide($operation, $uriVariables, $context);

        if (null === $session) {
            return null;
        }

        $session->setCumulativeScores($this->computeCumulativeScores($session));

        return $session;
    }

    /**
     * @return array<array{playerId: int, playerName: string, score: int}>
     */
    private function computeCumulativeScores(Session $session): array
    {
        $dql = <<<'DQL'
            SELECT IDENTITY(se.player) AS playerId, p.name AS playerName, SUM(se.score) AS totalScore
            FROM App\Entity\ScoreEntry se
            LEFT JOIN se.game g
            JOIN se.player p
            WHERE g.session = :session OR (se.game IS NULL AND se.session = :session)
            GROUP BY se.player, p.name
            ORDER BY p.name ASC
            DQL;

        /** @var array<array{playerId: int, playerName: string, totalScore: string}> $results */
        $results = $this->em->createQuery($dql)
            ->setParameter('session', $session->getId())
            ->getResult();

        return \array_map(static fn (array $row) => [
            'playerId' => $row['playerId'],
            'playerName' => $row['playerName'],
            'score' => (int) $row['totalScore'],
        ], $results);
    }
}
