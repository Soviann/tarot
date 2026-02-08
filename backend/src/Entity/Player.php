<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
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
    #[Groups(['player:read', 'session:detail'])]
    #[ORM\Id]
    #[ORM\Column]
    #[ORM\GeneratedValue]
    private ?int $id = null;

    #[Assert\NotBlank]
    #[Groups(['game:read', 'player:read', 'player:write', 'score-entry:read', 'session:detail', 'session:read'])]
    #[ORM\Column(length: 50, unique: true)]
    private string $name;

    #[Groups(['player:read'])]
    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    #[Groups(['player:read'])]
    #[ORM\Column(options: ['default' => 1500])]
    private int $eloRating = 1500;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;

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

    public function setEloRating(int $eloRating): static
    {
        $this->eloRating = $eloRating;

        return $this;
    }
}
