<?php

declare(strict_types=1);

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
class EloHistory
{
    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    #[ORM\ManyToOne(targetEntity: Game::class)]
    #[ORM\JoinColumn(nullable: false)]
    private Game $game;

    #[ORM\Id]
    #[ORM\Column]
    #[ORM\GeneratedValue]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Player::class)]
    #[ORM\JoinColumn(nullable: false)]
    private Player $player;

    #[ORM\Column]
    private int $ratingAfter;

    #[ORM\Column]
    private int $ratingBefore;

    #[ORM\Column]
    private int $ratingChange;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getGame(): Game
    {
        return $this->game;
    }

    public function setGame(Game $game): static
    {
        $this->game = $game;

        return $this;
    }

    public function getId(): ?int
    {
        return $this->id;
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

    public function getRatingAfter(): int
    {
        return $this->ratingAfter;
    }

    public function setRatingAfter(int $ratingAfter): static
    {
        $this->ratingAfter = $ratingAfter;

        return $this;
    }

    public function getRatingBefore(): int
    {
        return $this->ratingBefore;
    }

    public function setRatingBefore(int $ratingBefore): static
    {
        $this->ratingBefore = $ratingBefore;

        return $this;
    }

    public function getRatingChange(): int
    {
        return $this->ratingChange;
    }

    public function setRatingChange(int $ratingChange): static
    {
        $this->ratingChange = $ratingChange;

        return $this;
    }
}
