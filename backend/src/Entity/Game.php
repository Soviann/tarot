<?php

declare(strict_types=1);

namespace App\Entity;

use App\Enum\Chelem;
use App\Enum\Contract;
use App\Enum\GameStatus;
use App\Enum\Poignee;
use App\Enum\Side;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Bridge\Doctrine\IdGenerator\UuidGenerator;
use Symfony\Bridge\Doctrine\Types\UuidType;
use Symfony\Component\Uid\Uuid;
use Symfony\Component\Uid\UuidV7;

#[ORM\Entity]
class Game
{
    #[ORM\Id]
    #[ORM\Column(type: UuidType::NAME)]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: UuidGenerator::class)]
    private ?Uuid $id = null;

    #[ORM\Column(enumType: Chelem::class)]
    private Chelem $chelem = Chelem::None;

    #[ORM\Column(enumType: Contract::class)]
    private Contract $contract;

    #[ORM\Column(type: 'datetime_immutable')]
    private \DateTimeImmutable $createdAt;

    #[ORM\Column(nullable: true)]
    private ?int $oudlers = null;

    #[ORM\ManyToOne(targetEntity: Player::class)]
    #[ORM\JoinColumn(nullable: true)]
    private ?Player $partner = null;

    #[ORM\Column(enumType: Side::class)]
    private Side $petitAuBout = Side::None;

    #[ORM\Column(enumType: Poignee::class)]
    private Poignee $poignee = Poignee::None;

    #[ORM\Column(enumType: Side::class)]
    private Side $poigneeOwner = Side::None;

    #[ORM\Column(nullable: true)]
    private ?float $points = null;

    #[ORM\Column]
    private int $position;

    /** @var Collection<int, ScoreEntry> */
    #[ORM\OneToMany(targetEntity: ScoreEntry::class, mappedBy: 'game', cascade: ['persist', 'remove'])]
    private Collection $scoreEntries;

    #[ORM\ManyToOne(targetEntity: Session::class, inversedBy: 'games')]
    #[ORM\JoinColumn(nullable: false)]
    private Session $session;

    #[ORM\Column(enumType: GameStatus::class)]
    private GameStatus $status = GameStatus::InProgress;

    #[ORM\ManyToOne(targetEntity: Player::class)]
    #[ORM\JoinColumn(nullable: false)]
    private Player $taker;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
        $this->id = new UuidV7();
        $this->scoreEntries = new ArrayCollection();
    }

    public function getId(): ?Uuid
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

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
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
