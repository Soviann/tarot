<?php

declare(strict_types=1);

namespace App\State;

use ApiPlatform\Doctrine\Common\State\PersistProcessor;
use ApiPlatform\Metadata\Operation;
use ApiPlatform\State\ProcessorInterface;
use App\Dto\NewBadgesDto;
use App\Entity\ScoreEntry;
use App\Entity\Session;
use App\Entity\StarEvent;
use App\Enum\BadgeType;
use App\Service\BadgeChecker;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

/**
 * Crée un événement étoile : valide l'appartenance du joueur à la session,
 * et déclenche une pénalité tous les 3 étoiles.
 *
 * @implements ProcessorInterface<StarEvent, StarEvent>
 */
final readonly class StarEventCreateProcessor implements ProcessorInterface
{
    private const int PENALTY_POINTS = 100;
    private const int STARS_PER_PENALTY = 3;

    public function __construct(
        private BadgeChecker $badgeChecker,
        private EntityManagerInterface $em,
        private PersistProcessor $persistProcessor,
    ) {
    }

    /**
     * @param StarEvent $data
     */
    public function process(mixed $data, Operation $operation, array $uriVariables = [], array $context = []): StarEvent
    {
        /** @var Session|null $session */
        $session = $this->em->getRepository(Session::class)->find($uriVariables['sessionId']);

        if (null === $session) {
            throw new UnprocessableEntityHttpException('Session introuvable.');
        }

        $player = $data->getPlayer();

        // Vérifier que le joueur appartient à la session
        $belongs = false;
        foreach ($session->getPlayers() as $sessionPlayer) {
            if ($sessionPlayer->getId() === $player->getId()) {
                $belongs = true;
                break;
            }
        }

        if (!$belongs) {
            throw new UnprocessableEntityHttpException('Le joueur n\'appartient pas à la session.');
        }

        $data->setSession($session);

        /** @var StarEvent $starEvent */
        $starEvent = $this->persistProcessor->process($data, $operation, $uriVariables, $context);

        // Compter le nombre total d'étoiles pour ce joueur dans cette session
        $totalStars = (int) $this->em->createQuery(
            'SELECT COUNT(se.id) FROM App\Entity\StarEvent se WHERE se.session = :session AND se.player = :player'
        )
            ->setParameter('player', $player)
            ->setParameter('session', $session)
            ->getSingleScalarResult();

        // Déclencher la pénalité si le total est un multiple de 3
        if ($totalStars > 0 && 0 === $totalStars % self::STARS_PER_PENALTY) {
            $this->applyPenalty($session, $player);
        }

        // Vérifier les badges (ex : StarCollector)
        $newBadges = $this->badgeChecker->checkAndAward($session);
        if (!empty($newBadges)) {
            $starEvent->setNewBadges(NewBadgesDto::fromAwardedBadges($newBadges));
        }

        return $starEvent;
    }

    private function applyPenalty(Session $session, \App\Entity\Player $penalizedPlayer): void
    {
        $bonusPerPlayer = self::PENALTY_POINTS / 4;

        foreach ($session->getPlayers() as $player) {
            $entry = new ScoreEntry();
            $entry->setPlayer($player);
            $entry->setSession($session);

            if ($player->getId() === $penalizedPlayer->getId()) {
                $entry->setScore(-self::PENALTY_POINTS);
            } else {
                $entry->setScore($bonusPerPlayer);
            }

            $this->em->persist($entry);
        }

        $this->em->flush();
    }
}
