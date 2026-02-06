<?php

declare(strict_types=1);

namespace App\Tests\Api;

use ApiPlatform\Symfony\Bundle\Test\ApiTestCase as BaseApiTestCase;
use ApiPlatform\Symfony\Bundle\Test\Client;
use App\Entity\Player;
use App\Entity\Session;
use Doctrine\ORM\EntityManagerInterface;

abstract class ApiTestCase extends BaseApiTestCase
{
    protected static ?bool $alwaysBootKernel = true;

    protected Client $client;

    protected EntityManagerInterface $em;

    protected function setUp(): void
    {
        $this->client = static::createClient();
        $this->em = static::getContainer()->get(EntityManagerInterface::class);
    }

    protected function createPlayer(string $name): Player
    {
        $player = new Player();
        $player->setName($name);
        $this->em->persist($player);
        $this->em->flush();

        return $player;
    }

    protected function createSessionWithPlayers(string ...$names): Session
    {
        $session = new Session();
        foreach ($names as $name) {
            $session->addPlayer($this->createPlayer($name));
        }
        $this->em->persist($session);
        $this->em->flush();

        return $session;
    }

    protected function getIri(object $entity): string
    {
        return static::getContainer()->get('api_platform.iri_converter')->getIriFromResource($entity);
    }
}
