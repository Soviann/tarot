<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Doctrine\Common\State\PersistProcessor;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Player;
use App\Entity\PlayerGroup;
use App\Entity\Session;
use Doctrine\ORM\EntityManagerInterface;

/**
 * Smart-create : retourne une session active existante si les mêmes 5 joueurs
 * sont déjà en session, sinon crée une nouvelle session.
 *
 * @implements ProcessorInterface<Session, Session>
 */
final readonly class SessionCreateProcessor implements ProcessorInterface
{
    public function __construct(
        private EntityManagerInterface $em,
        private PersistProcessor $persistProcessor,
    ) {
    }

    /**
     * @param Session $data
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Session
    {
        $playerIds = [];
        foreach ($data->getPlayers() as $player) {
            $id = $player->getId();
            \assert(null !== $id);
            $playerIds[] = $id;
        }

        $existing = $this->findActiveSessionWithSamePlayers($playerIds, \count($playerIds));

        if (null !== $existing) {
            return $existing;
        }

        /** @var Session $session */
        $session = $this->persistProcessor->process($data, $operation, $uriVariables, $context);

        $firstPlayer = $session->getPlayers()->first();
        if (false !== $firstPlayer) {
            $session->setCurrentDealer($firstPlayer);
        }

        $this->autoAssociatePlayerGroup($session, $playerIds);
        $this->em->flush();

        return $session;
    }

    /**
     * @param int[] $playerIds
     */
    private function autoAssociatePlayerGroup(Session $session, array $playerIds): void
    {
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
        }
    }

    /**
     * @param int[] $playerIds
     */
    private function findActiveSessionWithSamePlayers(array $playerIds, int $count): ?Session
    {
        $dql = <<<'DQL'
            SELECT s FROM App\Entity\Session s
            JOIN s.players p
            WHERE s.isActive = true
            AND p.id IN (:playerIds)
            GROUP BY s.id
            HAVING COUNT(DISTINCT p.id) = :count
            DQL;

        /** @var Session[] $candidates */
        $candidates = $this->em->createQuery($dql)
            ->setParameter('count', $count)
            ->setParameter('playerIds', $playerIds)
            ->getResult();

        // Vérifier qu'une session candidate a exactement le bon nombre de joueurs (pas plus)
        foreach ($candidates as $session) {
            if ($session->getPlayers()->count() === $count) {
                return $session;
            }
        }

        return null;
    }
}
