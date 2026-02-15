<?php

declare(strict_types=1);

namespace App\Entity;

use App\Repository\ScoreEntryRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;

#[ORM\Entity(repositoryClass: ScoreEntryRepository::class)]
#[ORM\Index(columns: ['game_id', 'player_id'])]
class ScoreEntry
{
    #[ORM\ManyToOne(targetEntity: Game::class, inversedBy: 'scoreEntries')]
    #[ORM\JoinColumn(nullable: true)]
    private ?Game $game = null;

    #[Groups(['game:read', 'score-entry:read', 'session:detail'])]
    #[ORM\Id]
    #[ORM\Column]
    #[ORM\GeneratedValue]
    private ?int $id = null;

    #[Groups(['game:read', 'score-entry:read', 'session:detail'])]
    #[ORM\ManyToOne(targetEntity: Player::class)]
    #[ORM\JoinColumn(nullable: false)]
    private Player $player;

    #[Groups(['game:read', 'score-entry:read', 'session:detail'])]
    #[ORM\Column]
    private int $score;

    #[ORM\JoinColumn(nullable: true)]
    #[ORM\ManyToOne(targetEntity: Session::class)]
    private ?Session $session = null;

    public function getGame(): ?Game
    {
        return $this->game;
    }

    public function setGame(?Game $game): static
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

    public function getScore(): int
    {
        return $this->score;
    }

    public function setScore(int $score): static
    {
        $this->score = $score;

        return $this;
    }

    public function getSession(): ?Session
    {
        return $this->session;
    }

    public function setSession(?Session $session): static
    {
        $this->session = $session;

        return $this;
    }
}
