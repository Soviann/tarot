<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Doctrine\Common\State\PersistProcessor;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Player;
use App\Entity\PlayerGroup;
use App\Entity\Session;
use App\Repository\PlayerGroupRepository;
use App\Repository\SessionRepository;
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
        private PlayerGroupRepository $playerGroupRepository,
        private SessionRepository $sessionRepository,
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

        $count = \count($playerIds);
        $existing = $this->sessionRepository->findActiveWithExactPlayers($playerIds, $count);

        if (null !== $existing) {
            return $existing;
        }

        /** @var Session $session */
        $session = $this->persistProcessor->process($data, $operation, $uriVariables, $context);

        $firstPlayer = $session->getPlayers()->first();
        if (false !== $firstPlayer) {
            $session->setCurrentDealer($firstPlayer);
        }

        $this->autoAssociatePlayerGroup($session, $playerIds, $count);
        $this->em->flush();

        return $session;
    }

    /**
     * @param int[] $playerIds
     */
    private function autoAssociatePlayerGroup(Session $session, array $playerIds, int $count): void
    {
        if (empty($playerIds)) {
            return;
        }

        $matchingGroups = $this->playerGroupRepository->findMatchingExactPlayers($playerIds, $count);

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
}
