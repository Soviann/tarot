<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Doctrine\Common\State\PersistProcessor;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Entity\Game;
use App\Entity\Session;
use App\Enum\GameStatus;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

/**
 * Crée une donne sous une session : attribue la position et vérifie qu'aucune donne n'est en cours.
 *
 * @implements ProcessorInterface<Game, Game>
 */
final readonly class GameCreateProcessor implements ProcessorInterface
{
    public function __construct(
        private EntityManagerInterface $em,
        private PersistProcessor $persistProcessor,
    ) {
    }

    /**
     * @param Game $data
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): Game
    {
        /** @var Session $session */
        $session = $this->em->getRepository(Session::class)->find($uriVariables['sessionId']);

        if (null === $session) { // @phpstan-ignore identical.alwaysFalse
            throw new UnprocessableEntityHttpException('Session introuvable.');
        }

        // Vérifier qu'aucune donne n'est en cours
        $inProgress = $this->em->createQuery(
            'SELECT COUNT(g.id) FROM App\Entity\Game g WHERE g.session = :sessionId AND g.status = :status'
        )
            ->setParameter('sessionId', $session->getId())
            ->setParameter('status', GameStatus::InProgress)
            ->getSingleScalarResult();

        if ($inProgress > 0) {
            throw new UnprocessableEntityHttpException('Une donne est déjà en cours pour cette session.');
        }

        // Position auto-incrémentée
        $maxPosition = $this->em->createQuery(
            'SELECT MAX(g.position) FROM App\Entity\Game g WHERE g.session = :sessionId'
        )
            ->setParameter('sessionId', $session->getId())
            ->getSingleScalarResult();

        $data->setPosition(((int) $maxPosition) + 1);
        $data->setSession($session);
        $data->setStatus(GameStatus::InProgress);

        return $this->persistProcessor->process($data, $operation, $uriVariables, $context);
    }
}
