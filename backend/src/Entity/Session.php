<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\State\SessionCreateProcessor;
use App\State\SessionDetailProvider;
use App\State\SessionPatchProcessor;
use App\Validator\DealerBelongsToSession;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ApiResource(
    operations: [
        new Get(
            normalizationContext: ['groups' => ['session:read', 'session:detail']],
            provider: SessionDetailProvider::class,
        ),
        new GetCollection(),
        new Patch(
            denormalizationContext: ['groups' => ['session:patch']],
            normalizationContext: ['groups' => ['session:read', 'session:detail']],
            processor: SessionPatchProcessor::class,
            provider: SessionDetailProvider::class,
        ),
        new Post(processor: SessionCreateProcessor::class),
    ],
    normalizationContext: ['groups' => ['session:read']],
    denormalizationContext: ['groups' => ['session:write']],
)]
#[DealerBelongsToSession]
#[ORM\Entity]
class Session
{
    #[Groups(['session:read'])]
    #[ORM\Id]
    #[ORM\Column]
    #[ORM\GeneratedValue]
    private ?int $id = null;

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

    #[Groups(['session:detail', 'session:patch'])]
    #[ORM\JoinColumn(nullable: true)]
    #[ORM\ManyToOne(targetEntity: Player::class)]
    private ?Player $currentDealer = null;

    #[Groups(['session:read', 'session:patch'])]
    #[ORM\JoinColumn(nullable: true)]
    #[ORM\ManyToOne(targetEntity: PlayerGroup::class)]
    private ?PlayerGroup $playerGroup = null;

    /** @var Collection<int, Player> */
    #[Assert\Count(exactly: 5, exactMessage: 'Une session doit avoir exactement 5 joueurs.')]
    #[Groups(['session:read', 'session:write'])]
    #[ORM\ManyToMany(targetEntity: Player::class)]
    #[ORM\JoinTable(name: 'session_player')]
    #[ORM\OrderBy(['name' => 'ASC'])]
    private Collection $players;

    /** @var Collection<int, StarEvent> */
    #[Groups(['session:detail'])]
    #[ORM\OneToMany(targetEntity: StarEvent::class, mappedBy: 'session')]
    #[ORM\OrderBy(['createdAt' => 'ASC'])]
    private Collection $starEvents;

    /**
     * Scores cumulés par joueur — propriété non persistée, alimentée par SessionDetailProvider.
     *
     * @var array<array{playerId: int, playerName: string, score: int}>|null
     */
    #[Groups(['session:detail'])]
    private ?array $cumulativeScores = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->games = new ArrayCollection();
        $this->players = new ArrayCollection();
        $this->starEvents = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function advanceDealer(): void
    {
        $players = $this->players->getValues();
        $count = \count($players);

        if (0 === $count || null === $this->currentDealer) {
            return;
        }

        $currentIndex = -1;
        foreach ($players as $i => $player) {
            if ($player->getId() === $this->currentDealer->getId()) {
                $currentIndex = $i;
                break;
            }
        }

        if (-1 === $currentIndex) {
            return;
        }

        $this->currentDealer = $players[($currentIndex + 1) % $count];
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    #[Groups(['session:read'])]
    public function getLastPlayedAt(): \DateTimeImmutable
    {
        $latest = $this->createdAt;
        foreach ($this->games as $game) {
            if ($game->getCreatedAt() > $latest) {
                $latest = $game->getCreatedAt();
            }
        }

        return $latest;
    }

    public function getCurrentDealer(): ?Player
    {
        return $this->currentDealer;
    }

    public function setCurrentDealer(?Player $currentDealer): static
    {
        $this->currentDealer = $currentDealer;

        return $this;
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

    public function getPlayerGroup(): ?PlayerGroup
    {
        return $this->playerGroup;
    }

    public function setPlayerGroup(?PlayerGroup $playerGroup): static
    {
        $this->playerGroup = $playerGroup;

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
     * @return Collection<int, StarEvent>
     */
    public function getStarEvents(): Collection
    {
        return $this->starEvents;
    }

    /**
     * @return array<array{playerId: int, playerName: string, score: int}>|null
     */
    public function getCumulativeScores(): ?array
    {
        return $this->cumulativeScores;
    }

    /**
     * @param array<array{playerId: int, playerName: string, score: int}> $cumulativeScores
     */
    public function setCumulativeScores(array $cumulativeScores): static
    {
        $this->cumulativeScores = $cumulativeScores;

        return $this;
    }
}
