<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ApiResource(
    operations: [
        new Delete(uriTemplate: '/player-groups/{id}'),
        new Get(
            uriTemplate: '/player-groups/{id}',
            normalizationContext: ['groups' => ['player-group:read', 'player-group:detail']],
        ),
        new GetCollection(uriTemplate: '/player-groups'),
        new Patch(uriTemplate: '/player-groups/{id}'),
        new Post(uriTemplate: '/player-groups'),
    ],
    normalizationContext: ['groups' => ['player-group:read']],
    denormalizationContext: ['groups' => ['player-group:write']],
)]
#[ORM\Entity]
#[UniqueEntity('name')]
class PlayerGroup
{
    #[Groups(['player-group:read', 'player:read', 'session:read'])]
    #[ORM\Id]
    #[ORM\Column]
    #[ORM\GeneratedValue]
    private ?int $id = null;

    #[Groups(['player-group:read'])]
    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    #[Assert\NotBlank]
    #[Groups(['player-group:read', 'player-group:write', 'player:read', 'session:read'])]
    #[ORM\Column(length: 100, unique: true)]
    private string $name;

    /** @var Collection<int, Player> */
    #[Groups(['player-group:detail', 'player-group:write'])]
    #[ORM\JoinTable(name: 'player_group_player')]
    #[ORM\ManyToMany(targetEntity: Player::class, inversedBy: 'playerGroups')]
    #[ORM\OrderBy(['name' => 'ASC'])]
    private Collection $players;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->players = new ArrayCollection();
    }

    public function addPlayer(Player $player): static
    {
        if (!$this->players->contains($player)) {
            $this->players->add($player);
        }

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    /**
     * @return Collection<int, Player>
     */
    public function getPlayers(): Collection
    {
        return $this->players;
    }

    public function removePlayer(Player $player): static
    {
        $this->players->removeElement($player);

        return $this;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }
}
