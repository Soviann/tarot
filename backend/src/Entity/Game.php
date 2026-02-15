<?php

declare(strict_types=1);

namespace App\Entity;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Delete;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Link;
use ApiPlatform\Metadata\Patch;
use ApiPlatform\Metadata\Post;
use App\Dto\NewBadgesDto;
use App\Enum\Chelem;
use App\Enum\Contract;
use App\Enum\GameStatus;
use App\Enum\Poignee;
use App\Enum\Side;
use App\Repository\GameRepository;
use App\State\GameCompleteProcessor;
use App\State\GameCreateProcessor;
use App\State\GameDeleteProcessor;
use App\Validator\OnlyLastGameEditable;
use App\Validator\PlayersBelongToSession;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Attribute\Groups;
use Symfony\Component\Validator\Constraints as Assert;

#[ApiResource(
    operations: [
        new Delete(
            validationContext: ['groups' => ['Default', 'game:delete']],
            validate: true,
            processor: GameDeleteProcessor::class,
        ),
        new Get(),
        new Patch(
            validationContext: ['groups' => ['Default', 'game:patch']],
            processor: GameCompleteProcessor::class,
        ),
    ],
    normalizationContext: ['groups' => ['game:read']],
    denormalizationContext: ['groups' => ['game:complete']],
)]
#[ApiResource(
    uriTemplate: '/sessions/{sessionId}/games',
    operations: [
        new GetCollection(
            paginationItemsPerPage: 10,
            order: ['position' => 'DESC'],
        ),
        new Post(denormalizationContext: ['groups' => ['game:create']], read: false, processor: GameCreateProcessor::class
        ),
    ],
    uriVariables: [
        'sessionId' => new Link(toProperty: 'session', fromClass: Session::class),
    ],
    normalizationContext: ['groups' => ['game:read']],
)]
#[OnlyLastGameEditable(groups: ['game:delete', 'game:patch'])]
#[ORM\Entity(repositoryClass: GameRepository::class)]
#[PlayersBelongToSession(groups: ['game:patch'])]
class Game
{
    #[Groups(['game:read', 'session:detail'])]
    #[ORM\Id]
    #[ORM\Column]
    #[ORM\GeneratedValue]
    private ?int $id = null;

    #[Groups(['game:read', 'game:complete', 'session:detail'])]
    #[ORM\Column(enumType: Chelem::class)]
    private Chelem $chelem = Chelem::None;

    #[Groups(['game:read', 'session:detail'])]
    #[ORM\Column(type: 'datetime_immutable', nullable: true)]
    private ?\DateTimeImmutable $completedAt = null;

    #[Groups(['game:read', 'game:create', 'session:detail'])]
    #[ORM\Column(enumType: Contract::class)]
    private Contract $contract;

    #[Groups(['game:read', 'session:detail'])]
    #[ORM\JoinColumn(nullable: true)]
    #[ORM\ManyToOne(targetEntity: Player::class)]
    private ?Player $dealer = null;

    #[Groups(['game:read', 'session:detail'])]
    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    #[Assert\Range(max: 3, min: 0)]
    #[Groups(['game:read', 'game:complete', 'session:detail'])]
    #[ORM\Column(nullable: true)]
    private ?int $oudlers = null;

    #[Groups(['game:read', 'game:complete', 'session:detail'])]
    #[ORM\ManyToOne(targetEntity: Player::class)]
    #[ORM\JoinColumn(nullable: true)]
    private ?Player $partner = null;

    #[Groups(['game:read', 'game:complete', 'session:detail'])]
    #[ORM\Column(enumType: Side::class)]
    private Side $petitAuBout = Side::None;

    #[Groups(['game:read', 'game:complete', 'session:detail'])]
    #[ORM\Column(enumType: Poignee::class)]
    private Poignee $poignee = Poignee::None;

    #[Groups(['game:read', 'game:complete', 'session:detail'])]
    #[ORM\Column(enumType: Side::class)]
    private Side $poigneeOwner = Side::None;

    #[Assert\Range(max: 91, min: 0)]
    #[Groups(['game:read', 'game:complete', 'session:detail'])]
    #[ORM\Column(nullable: true)]
    private ?float $points = null;

    #[Groups(['game:read', 'session:detail'])]
    #[ORM\Column]
    private int $position;

    /** @var Collection<int, ScoreEntry> */
    #[Groups(['game:read', 'session:detail'])]
    #[ORM\OneToMany(targetEntity: ScoreEntry::class, mappedBy: 'game', cascade: ['persist', 'remove'])]
    private Collection $scoreEntries;

    #[ORM\ManyToOne(targetEntity: Session::class, inversedBy: 'games')]
    #[ORM\JoinColumn(nullable: false)]
    private Session $session;

    #[Groups(['game:read', 'game:complete', 'session:detail'])]
    #[ORM\Column(enumType: GameStatus::class)]
    private GameStatus $status = GameStatus::InProgress;

    #[Groups(['game:read', 'game:create', 'session:detail'])]
    #[ORM\ManyToOne(targetEntity: Player::class)]
    #[ORM\JoinColumn(nullable: false)]
    private Player $taker;

    #[Groups(['game:read'])]
    private ?NewBadgesDto $newBadges = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->scoreEntries = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getChelem(): Chelem
    {
        return $this->chelem;
    }

    public function setChelem(Chelem $chelem): static
    {
        $this->chelem = $chelem;

        return $this;
    }

    public function getContract(): Contract
    {
        return $this->contract;
    }

    public function setContract(Contract $contract): static
    {
        $this->contract = $contract;

        return $this;
    }

    public function getCompletedAt(): ?\DateTimeImmutable
    {
        return $this->completedAt;
    }

    public function setCompletedAt(?\DateTimeImmutable $completedAt): static
    {
        $this->completedAt = $completedAt;

        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function getDealer(): ?Player
    {
        return $this->dealer;
    }

    public function setDealer(?Player $dealer): static
    {
        $this->dealer = $dealer;

        return $this;
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

    public function getOudlers(): ?int
    {
        return $this->oudlers;
    }

    public function setOudlers(?int $oudlers): static
    {
        $this->oudlers = $oudlers;

        return $this;
    }

    public function getPartner(): ?Player
    {
        return $this->partner;
    }

    public function setPartner(?Player $partner): static
    {
        $this->partner = $partner;

        return $this;
    }

    public function getPetitAuBout(): Side
    {
        return $this->petitAuBout;
    }

    public function setPetitAuBout(Side $petitAuBout): static
    {
        $this->petitAuBout = $petitAuBout;

        return $this;
    }

    public function getPoignee(): Poignee
    {
        return $this->poignee;
    }

    public function setPoignee(Poignee $poignee): static
    {
        $this->poignee = $poignee;

        return $this;
    }

    public function getPoigneeOwner(): Side
    {
        return $this->poigneeOwner;
    }

    public function setPoigneeOwner(Side $poigneeOwner): static
    {
        $this->poigneeOwner = $poigneeOwner;

        return $this;
    }

    public function getPoints(): ?float
    {
        return $this->points;
    }

    public function setPoints(?float $points): static
    {
        $this->points = $points;

        return $this;
    }

    public function getPosition(): int
    {
        return $this->position;
    }

    public function setPosition(int $position): static
    {
        $this->position = $position;

        return $this;
    }

    /**
     * @return Collection<int, ScoreEntry>
     */
    public function getScoreEntries(): Collection
    {
        return $this->scoreEntries;
    }

    public function addScoreEntry(ScoreEntry $scoreEntry): static
    {
        if (!$this->scoreEntries->contains($scoreEntry)) {
            $this->scoreEntries->add($scoreEntry);
            $scoreEntry->setGame($this);
        }

        return $this;
    }

    public function removeScoreEntry(ScoreEntry $scoreEntry): static
    {
        $this->scoreEntries->removeElement($scoreEntry);

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

    public function getStatus(): GameStatus
    {
        return $this->status;
    }

    public function setStatus(GameStatus $status): static
    {
        $this->status = $status;

        return $this;
    }

    public function getTaker(): Player
    {
        return $this->taker;
    }

    public function setTaker(Player $taker): static
    {
        $this->taker = $taker;

        return $this;
    }
}
