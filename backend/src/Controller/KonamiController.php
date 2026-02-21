<?php

declare(strict_types=1);

namespace App\Controller;

use App\Entity\PlayerBadge;
use App\Enum\BadgeType;
use App\Repository\PlayerBadgeRepository;
use App\Repository\PlayerRepository;
use App\Service\BadgeChecker;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Attribute\Route;

readonly class KonamiController
{
    public function __construct(
        private BadgeChecker $badgeChecker,
        private EntityManagerInterface $em,
        private PlayerBadgeRepository $playerBadgeRepository,
        private PlayerRepository $playerRepository,
    ) {
    }

    #[Route('/api/players/{id}/konami', methods: ['POST'])]
    public function __invoke(int $id): JsonResponse
    {
        $player = $this->playerRepository->find($id);
        if (null === $player) {
            throw new NotFoundHttpException('Joueur introuvable.');
        }

        $existingTypes = $this->playerBadgeRepository->getExistingBadgeTypesForPlayer($player);

        if (\in_array(BadgeType::Konami, $existingTypes, true)) {
            return new JsonResponse(null, Response::HTTP_OK);
        }

        $badge = new PlayerBadge();
        $badge->setBadgeType(BadgeType::Konami);
        $badge->setPlayer($player);
        $this->em->persist($badge);
        $this->em->flush();

        // Trigger CatchThemAll check
        $newBadges = $this->badgeChecker->checkAndAwardForPlayer($player);

        $badgeData = BadgeType::Konami->toArray();
        $result = ['badge' => $badgeData, 'newBadges' => []];

        foreach ($newBadges as $newBadge) {
            $result['newBadges'][] = $newBadge->toArray();
        }

        return new JsonResponse($result);
    }
}
