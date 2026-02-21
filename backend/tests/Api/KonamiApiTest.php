<?php

declare(strict_types=1);

namespace App\Tests\Api;

use App\Entity\PlayerBadge;
use App\Enum\BadgeType;

class KonamiApiTest extends ApiTestCase
{
    public function testKonamiEndpointAwardsBadge(): void
    {
        $player = $this->createPlayer('KonamiPlayer');

        $this->client->request('POST', \sprintf('/api/players/%d/konami', $player->getId()));

        self::assertResponseIsSuccessful();

        $data = \json_decode($this->client->getResponse()->getContent(), true);
        self::assertSame('konami', $data['badge']['type']);
    }

    public function testKonamiEndpointIsIdempotent(): void
    {
        $player = $this->createPlayer('KonamiPlayer');

        $this->client->request('POST', \sprintf('/api/players/%d/konami', $player->getId()));
        self::assertResponseIsSuccessful();

        // Second call should also return 200 with no new badge
        $this->client->request('POST', \sprintf('/api/players/%d/konami', $player->getId()));
        self::assertResponseIsSuccessful();

        $data = \json_decode($this->client->getResponse()->getContent(), true);
        self::assertArrayNotHasKey('badge', $data);
    }

    public function testKonamiEndpointReturns404ForUnknownPlayer(): void
    {
        $this->client->request('POST', '/api/players/99999/konami');

        self::assertResponseStatusCodeSame(404);
    }

    public function testKonamiTriggersCatchThemAll(): void
    {
        $player = $this->createPlayer('KonamiCollector');

        // Grant all badges except Konami and CatchThemAll
        foreach (BadgeType::cases() as $badgeType) {
            if (BadgeType::CatchThemAll === $badgeType || BadgeType::Konami === $badgeType) {
                continue;
            }
            $badge = new PlayerBadge();
            $badge->setBadgeType($badgeType);
            $badge->setPlayer($player);
            $this->em->persist($badge);
        }
        $this->em->flush();

        $this->client->request('POST', \sprintf('/api/players/%d/konami', $player->getId()));
        self::assertResponseIsSuccessful();

        $data = \json_decode($this->client->getResponse()->getContent(), true);

        // Should have triggered CatchThemAll
        $newBadgeTypes = \array_column($data['newBadges'], 'type');
        self::assertContains('catch_them_all', $newBadgeTypes);
    }
}
