<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
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
        new Get(),
        new GetCollection(),
        new Patch(),
        new Post(),
    ],
    normalizationContext: ['groups' => ['player:read']],
    denormalizationContext: ['groups' => ['player:write']],
)]
#[ORM\Entity]
#[UniqueEntity('name')]
class Player
{
    #[Groups(['player-group:detail', 'player:read', 'session:detail', 'session:read'])]
    #[ORM\Id]
    #[ORM\Column]
    #[ORM\GeneratedValue]
    private ?int $id = null;

    #[Groups(['player:read', 'player:write'])]
    #[ORM\Column(options: ['default' => true])]
    private bool $active = true;

    #[Groups(['player:read'])]
    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    #[Groups(['player:read'])]
    #[ORM\Column(options: ['default' => 1500])]
    private int $eloRating = 1500;

    #[Assert\NotBlank]
    #[Groups(['game:read', 'player-group:detail', 'player:read', 'player:write', 'score-entry:read', 'session:detail', 'session:read'])]
    #[ORM\Column(length: 50, unique: true)]
    private string $name;

    /** @var Collection<int, PlayerGroup> */
    #[Groups(['player:read', 'player:write'])]
    #[ORM\ManyToMany(targetEntity: PlayerGroup::class, mappedBy: 'players')]
    #[ORM\OrderBy(['name' => 'ASC'])]
    private Collection $playerGroups;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->playerGroups = new ArrayCollection();
    }

    public function addPlayerGroup(PlayerGroup $playerGroup): static
    {
        if (!$this->playerGroups->contains($playerGroup)) {
            $this->playerGroups->add($playerGroup);
            $playerGroup->addPlayer($this);
        }

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getEloRating(): int
    {
        return $this->eloRating;
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
     * @return Collection<int, PlayerGroup>
     */
    public function getPlayerGroups(): Collection
    {
        return $this->playerGroups;
    }

    public function removePlayerGroup(PlayerGroup $playerGroup): static
    {
        if ($this->playerGroups->removeElement($playerGroup)) {
            $playerGroup->removePlayer($this);
        }

        return $this;
    }

    public function isActive(): bool
    {
        return $this->active;
    }

    public function setActive(bool $active): static
    {
        $this->active = $active;

        return $this;
    }

    public function setEloRating(int $eloRating): static
    {
        $this->eloRating = $eloRating;

        return $this;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

        return $this;
    }
}
