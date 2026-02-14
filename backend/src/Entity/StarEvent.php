<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Link;
use ApiPlatform\Metadata\Post;
use App\Dto\NewBadgesDto;
use App\Repository\StarEventRepository;
use App\State\StarEventCreateProcessor;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ApiResource(
    uriTemplate: '/sessions/{sessionId}/star-events',
    operations: [
        new GetCollection(),
        new Post(read: false, processor: StarEventCreateProcessor::class),
    ],
    uriVariables: [
        'sessionId' => new Link(toProperty: 'session', fromClass: Session::class),
    ],
    normalizationContext: ['groups' => ['star-event:read']],
    denormalizationContext: ['groups' => ['star-event:write']],
)]
#[ORM\Entity(repositoryClass: StarEventRepository::class)]
class StarEvent
{
    #[Groups(['session:detail', 'star-event:read'])]
    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    #[Groups(['session:detail', 'star-event:read'])]
    #[ORM\Id]
    #[ORM\Column]
    #[ORM\GeneratedValue]
    private ?int $id = null;

    #[Assert\NotNull]
    #[Groups(['session:detail', 'star-event:read', 'star-event:write'])]
    #[ORM\JoinColumn(nullable: false)]
    #[ORM\ManyToOne(targetEntity: Player::class)]
    private Player $player;

    #[Groups(['star-event:read'])]
    private ?NewBadgesDto $newBadges = null;

    #[ORM\JoinColumn(nullable: false)]
    #[ORM\ManyToOne(targetEntity: Session::class, inversedBy: 'starEvents')]
    private Session $session;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getNewBadges(): ?NewBadgesDto
    {
        return $this->newBadges;
    }

    public function setNewBadges(?NewBadgesDto $newBadges): static
    {
        $this->newBadges = $newBadges;

        return $this;
    }

    public function getPlayer(): Player
    {
        return $this->player;
    }

    public function setPlayer(Player $player): static
    {
        $this->player = $player;

        return $this;
    }

    public function getSession(): Session
    {
        return $this->session;
    }

    public function setSession(Session $session): static
    {
        $this->session = $session;

        return $this;
    }
}
