<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Doctrine\Orm\State\ItemProvider;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Entity\Player;
use App\Entity\PlayerGroup;
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
        $this->autoAssociatePlayerGroup($session);

        return $session;
    }

    private function autoAssociatePlayerGroup(Session $session): void
    {
        if (null !== $session->getPlayerGroup()) {
            return;
        }

        $playerIds = $session->getPlayers()->map(
            static fn (Player $p) => $p->getId()
        )->getValues();

        if (empty($playerIds)) {
            return;
        }

        $count = \count($playerIds);

        /** @var list<PlayerGroup> $matchingGroups */
        $matchingGroups = $this->em->createQuery(
            'SELECT pg FROM App\Entity\PlayerGroup pg
             JOIN pg.players p
             WHERE p.id IN (:playerIds)
             GROUP BY pg.id
             HAVING COUNT(DISTINCT p.id) = :count'
        )
            ->setParameter('count', $count)
            ->setParameter('playerIds', $playerIds)
            ->getResult();

        $matchingGroups = \array_values(\array_filter(
            $matchingGroups,
            static function (PlayerGroup $pg) use ($playerIds): bool {
                $groupPlayerIds = $pg->getPlayers()->map(
                    static fn (Player $p) => $p->getId()
                )->getValues();

                return empty(\array_diff($playerIds, $groupPlayerIds));
            }
        ));

        if (1 === \count($matchingGroups)) {
            $session->setPlayerGroup($matchingGroups[0]);
            $this->em->flush();
        }
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
