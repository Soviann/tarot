<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProviderInterface;
use App\Entity\Session;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Fournit la liste des sessions triées par dernière activité décroissante, limitée à 5.
 *
 * @implements ProviderInterface<Session>
 */
final readonly class SessionCollectionProvider implements ProviderInterface
{
    private const MAX_RESULTS = 5;

    public function __construct(
        private EntityManagerInterface $em,
    ) {
    }

    /**
     * @return Session[]
     */
    public function provide(Operation $operation, array $uriVariables = [], array $context = []): array
    {
        $dql = <<<'DQL'
            SELECT s, COALESCE(MAX(g.createdAt), s.createdAt) AS HIDDEN lastActivity
            FROM App\Entity\Session s
            LEFT JOIN s.games g
            GROUP BY s
            ORDER BY lastActivity DESC
            DQL;

        /** @var Session[] $sessions */
        $sessions = $this->em->createQuery($dql)
            ->setMaxResults(self::MAX_RESULTS)
            ->getResult();

        return $sessions;
    }
}
