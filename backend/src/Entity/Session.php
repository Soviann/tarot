<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use App\State\SessionCreateProcessor;
use App\State\SessionDetailProvider;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Uid\UuidV7;
use Symfony\Component\Validator\Constraints as Assert;

#[ApiResource(
    operations: [
        new Get(
            normalizationContext: ['groups' => ['session:read', 'session:detail']],
            provider: SessionDetailProvider::class,
        ),
        new GetCollection(),
        new Post(processor: SessionCreateProcessor::class),
    ],
    normalizationContext: ['groups' => ['session:read']],
    denormalizationContext: ['groups' => ['session:write']],
)]
#[ORM\Entity]
class Session
{
    #[Groups(['session:read'])]
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $id = null;

    #[Groups(['session:read'])]
    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    /** @var Collection<int, Game> */
    #[Groups(['session:detail'])]
    #[ORM\OneToMany(targetEntity: Game::class, mappedBy: 'session')]
    private Collection $games;

    #[Groups(['session:read'])]
    #[ORM\Column]
    private bool $isActive = true;

    /** @var Collection<int, Player> */
    #[Assert\Count(exactly: 5, exactMessage: 'Une session doit avoir exactement 5 joueurs.')]
    #[Groups(['session:read', 'session:write'])]
    #[ORM\ManyToMany(targetEntity: Player::class)]
    #[ORM\JoinTable(name: 'session_player')]
    #[ORM\OrderBy(['name' => 'ASC'])]
    private Collection $players;

    /**
     * Scores cumulés par joueur — propriété non persistée, alimentée par SessionDetailProvider.
     *
     * @var array<array{playerId: string, playerName: string, score: int}>|null
     */
    #[Groups(['session:detail'])]
    private ?array $cumulativeScores = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->games = new ArrayCollection();
        $this->id = new UuidV7();
        $this->players = new ArrayCollection();
    }

    public function getId(): ?Uuid
    {
        return $this->id;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    /**
     * @return Collection<int, Game>
     */
    public function getGames(): Collection
    {
        return $this->games;
    }

    public function addGame(Game $game): static
    {
        if (!$this->games->contains($game)) {
            $this->games->add($game);
            $game->setSession($this);
        }

        return $this;
    }

    public function removeGame(Game $game): static
    {
        $this->games->removeElement($game);

        return $this;
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): static
    {
        $this->isActive = $isActive;

        return $this;
    }

    /**
     * @return Collection<int, Player>
     */
    public function getPlayers(): Collection
    {
        return $this->players;
    }

    public function addPlayer(Player $player): static
    {
        if (!$this->players->contains($player)) {
            $this->players->add($player);
        }

        return $this;
    }

    public function removePlayer(Player $player): static
    {
        $this->players->removeElement($player);

        return $this;
    }

    /**
     * @return array<array{playerId: string, playerName: string, score: int}>|null
     */
    public function getCumulativeScores(): ?array
    {
        return $this->cumulativeScores;
    }

    /**
     * @param array<array{playerId: string, playerName: string, score: int}> $cumulativeScores
     */
    public function setCumulativeScores(array $cumulativeScores): static
    {
        $this->cumulativeScores = $cumulativeScores;

        return $this;
    }
}
