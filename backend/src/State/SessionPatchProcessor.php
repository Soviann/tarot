<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Doctrine\Common\State\PersistProcessor;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Session;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

/**
 * Propagates session players to the assigned group on manual group change.
 * Prevents reactivation of a closed session.
 *
 * @implements ProcessorInterface<Session, Session>
 */
final readonly class SessionPatchProcessor implements ProcessorInterface
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
        $originalData = $this->em->getUnitOfWork()->getOriginalEntityData($data);

        if (false === ($originalData['isActive'] ?? true) && $data->getIsActive()) {
            throw new UnprocessableEntityHttpException('Une session terminée ne peut pas être réouverte.');
        }

        $group = $data->getPlayerGroup();

        $data->setUpdatedAt(new \DateTimeImmutable());

        /** @var Session $session */
        $session = $this->persistProcessor->process($data, $operation, $uriVariables, $context);

        if (null !== $group) {
            $changed = false;
            foreach ($session->getPlayers() as $player) {
                if (!$group->getPlayers()->contains($player)) {
                    $group->addPlayer($player);
                    $changed = true;
                }
            }
            if ($changed) {
                $this->em->flush();
            }
        }

        return $session;
    }
}
