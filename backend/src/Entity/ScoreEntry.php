<?php

declare(strict_types=1);

namespace App\Entity;

use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity]
class ScoreEntry
{
    #[Groups(['game:read', 'score-entry:read', 'session:detail'])]
    #[ORM\Id]
    #[ORM\Column]
    #[ORM\GeneratedValue]
    private ?int $id = null;

    #[ORM\ManyToOne(targetEntity: Game::class, inversedBy: 'scoreEntries')]
    #[ORM\JoinColumn(nullable: false)]
    private Game $game;

    #[Groups(['game:read', 'score-entry:read', 'session:detail'])]
    #[ORM\ManyToOne(targetEntity: Player::class)]
    #[ORM\JoinColumn(nullable: false)]
    private Player $player;

    #[Groups(['game:read', 'score-entry:read', 'session:detail'])]
    #[ORM\Column]
    private int $score;

    public function getId(): ?int
    {
        return $this->id;
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

    public function getPlayer(): Player
    {
        return $this->player;
    }

    public function setPlayer(Player $player): static
    {
        $this->player = $player;

        return $this;
    }

    public function getScore(): int
    {
        return $this->score;
    }

    public function setScore(int $score): static
    {
        $this->score = $score;

        return $this;
    }
}
