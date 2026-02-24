<?php

declare(strict_types=1);

namespace App\Tests\Api;

use ApiPlatform\Symfony\Bundle\Test\ApiTestCase as BaseApiTestCase;
use ApiPlatform\Symfony\Bundle\Test\Client;
use App\Entity\Game;
use App\Entity\Player;
use App\Entity\PlayerGroup;
use App\Entity\ScoreEntry;
use App\Entity\Session;
use App\Enum\Chelem;
use App\Enum\Contract;
use App\Enum\GameStatus;
use App\Enum\Poignee;
use App\Enum\Side;
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
        static::getContainer()->get('cache.rate_limiter')->clear();
    }

    protected function createPlayerGroup(string $name, Player ...$players): PlayerGroup
    {
        $group = new PlayerGroup();
        $group->setName($name);
        foreach ($players as $player) {
            $group->addPlayer($player);
        }
        $this->em->persist($group);
        $this->em->flush();

        return $group;
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

    protected function completeGame(
        Session $session,
        Player $taker,
        Contract $contract = Contract::Petite,
        Chelem $chelem = Chelem::None,
        float $points = 56,
        int $oudlers = 3,
        ?\DateTimeImmutable $completedAt = null,
        ?Player $partner = null,
        Side $petitAuBout = Side::None,
        Poignee $poignee = Poignee::None,
        Side $poigneeOwner = Side::None,
        ?int $takerScore = null,
    ): Game {
        $game = new Game();
        $game->setChelem($chelem);
        $game->setCompletedAt($completedAt ?? new \DateTimeImmutable());
        $game->setContract($contract);
        $game->setOudlers($oudlers);
        $game->setPartner($partner);
        $game->setPetitAuBout($petitAuBout);
        $game->setPoignee($poignee);
        $game->setPoigneeOwner($poigneeOwner);
        $game->setPoints($points);
        $game->setPosition($session->getGames()->count() + 1);
        $game->setSession($session);
        $game->setStatus(GameStatus::Completed);
        $game->setTaker($taker);

        $this->em->persist($game);
        $session->addGame($game);

        $actualTakerScore = $takerScore ?? 100;
        $defenseScore = (int) (-$actualTakerScore / 4);

        $players = $session->getPlayers()->toArray();
        foreach ($players as $player) {
            $entry = new ScoreEntry();
            $entry->setGame($game);
            $entry->setPlayer($player);
            $entry->setSession($session);

            if ($player->getId() === $taker->getId()) {
                $entry->setScore($actualTakerScore);
            } elseif (null !== $partner && $player->getId() === $partner->getId()) {
                $entry->setScore((int) ($actualTakerScore / 2));
            } else {
                $entry->setScore($defenseScore);
            }

            $this->em->persist($entry);
            $game->addScoreEntry($entry);
        }

        $this->em->flush();

        return $game;
    }
}
