<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\BadgeType;
use App\Repository\PlayerBadgeRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: PlayerBadgeRepository::class)]
#[ORM\UniqueConstraint(columns: ['player_id', 'badge_type'])]
class PlayerBadge
{
    #[ORM\Id]
    #[ORM\Column]
    #[ORM\GeneratedValue]
    private ?int $id = null;

    #[ORM\Column(enumType: BadgeType::class)]
    private BadgeType $badgeType;

    #[ORM\ManyToOne(targetEntity: Player::class)]
    #[ORM\JoinColumn(nullable: false)]
    private Player $player;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $unlockedAt;

    public function __construct()
    {
        $this->unlockedAt = new \DateTimeImmutable();
    }

    public function getBadgeType(): BadgeType
    {
        return $this->badgeType;
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getPlayer(): Player
    {
        return $this->player;
    }

    public function getUnlockedAt(): \DateTimeImmutable
    {
        return $this->unlockedAt;
    }

    public function setBadgeType(BadgeType $badgeType): static
    {
        $this->badgeType = $badgeType;

        return $this;
    }

    public function setPlayer(Player $player): static
    {
        $this->player = $player;

        return $this;
    }

    public function setUnlockedAt(\DateTimeImmutable $unlockedAt): static
    {
        $this->unlockedAt = $unlockedAt;

        return $this;
    }
}
