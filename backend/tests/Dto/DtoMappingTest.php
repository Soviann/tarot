<?php

declare(strict_types=1);

namespace App\Tests\Dto;

use App\Dto\BadgeDto;
use App\Dto\BestSessionTotalDto;
use App\Dto\ContractDistributionDto;
use App\Dto\CumulativeScoreDto;
use App\Dto\EloRankingEntryDto;
use App\Dto\GameTakerScoreDto;
use App\Dto\NewBadgesDto;
use App\Dto\PlayerExtremeScoreDto;
use App\Dto\TakerGameDetailDto;
use App\Dto\TakerGameHighlightDto;
use App\Dto\TakerGameRecordDto;
use App\Enum\BadgeType;
use App\Enum\Chelem;
use App\Enum\Contract;
use App\Enum\Poignee;
use App\Enum\Side;
use PHPUnit\Framework\TestCase;

final class DtoMappingTest extends TestCase
{
    public function testTakerGameRecordDtoWithNativeTypes(): void
    {
        $date = new \DateTimeImmutable('2026-02-24');
        $dto = new TakerGameRecordDto(
            contract: Contract::Garde,
            date: $date,
            gameId: 42,
            oudlers: 2,
            points: 56.5,
            score: 120,
            sessionId: 7,
        );

        self::assertSame(Contract::Garde, $dto->contract);
        self::assertSame($date, $dto->date);
        self::assertSame(42, $dto->gameId);
        self::assertSame(2, $dto->oudlers);
        self::assertSame(56.5, $dto->points);
        self::assertSame(120, $dto->score);
        self::assertSame(7, $dto->sessionId);
    }

    public function testTakerGameRecordDtoWithStringCoercion(): void
    {
        $date = new \DateTimeImmutable('2026-01-15');
        $dto = new TakerGameRecordDto(
            contract: Contract::Petite,
            date: $date,
            gameId: '99',
            oudlers: null,
            points: null,
            score: '-45',
            sessionId: '3',
        );

        self::assertSame(99, $dto->gameId);
        self::assertNull($dto->oudlers);
        self::assertNull($dto->points);
        self::assertSame(-45, $dto->score);
        self::assertSame(3, $dto->sessionId);
    }

    public function testContractDistributionDtoCoercion(): void
    {
        $dtoInt = new ContractDistributionDto(contract: Contract::GardeSans, count: 5);
        self::assertSame(Contract::GardeSans, $dtoInt->contract);
        self::assertSame(5, $dtoInt->count);

        $dtoStr = new ContractDistributionDto(contract: Contract::GardeContre, count: '12');
        self::assertSame(Contract::GardeContre, $dtoStr->contract);
        self::assertSame(12, $dtoStr->count);
    }

    public function testTakerGameDetailDtoWithNativeTypes(): void
    {
        $date = new \DateTimeImmutable('2026-03-25');
        $dto = new TakerGameDetailDto(
            chelem: Chelem::None,
            completedAt: $date,
            contract: Contract::Garde,
            gameId: 10,
            oudlers: 3,
            partnerId: 5,
            poignee: Poignee::Simple,
            poigneeOwner: Side::Attack,
            points: 60.5,
            takerId: 2,
            takerScore: 150,
        );

        self::assertSame('none', $dto->chelem);
        self::assertSame($date, $dto->completedAt);
        self::assertSame('garde', $dto->contract);
        self::assertSame(10, $dto->gameId);
        self::assertSame(3, $dto->oudlers);
        self::assertSame(5, $dto->partnerId);
        self::assertSame('simple', $dto->poignee);
        self::assertSame('attack', $dto->poigneeOwner);
        self::assertSame(60.5, $dto->points);
        self::assertSame(2, $dto->takerId);
        self::assertSame(150, $dto->takerScore);
    }

    public function testTakerGameDetailDtoWithStringAndEnumCoercion(): void
    {
        $dto = new TakerGameDetailDto(
            chelem: 'announced_won',
            completedAt: '2026-01-15 10:00:00',
            contract: 'garde_sans',
            gameId: '7',
            oudlers: '2',
            partnerId: null,
            poignee: Poignee::Double,
            poigneeOwner: 'defense',
            points: '45',
            takerId: '3',
            takerScore: '-80',
        );

        self::assertSame('announced_won', $dto->chelem);
        self::assertInstanceOf(\DateTimeImmutable::class, $dto->completedAt);
        self::assertSame('2026-01-15', $dto->completedAt->format('Y-m-d'));
        self::assertSame('garde_sans', $dto->contract);
        self::assertSame(7, $dto->gameId);
        self::assertSame(2, $dto->oudlers);
        self::assertNull($dto->partnerId);
        self::assertSame('double', $dto->poignee);
        self::assertSame('defense', $dto->poigneeOwner);
        self::assertSame(45.0, $dto->points);
        self::assertSame(3, $dto->takerId);
        self::assertSame(-80, $dto->takerScore);
    }

    public function testCumulativeScoreDtoCoercion(): void
    {
        $dto = new CumulativeScoreDto(playerId: '11', playerName: 'Alice', score: '300');

        self::assertSame(11, $dto->playerId);
        self::assertSame('Alice', $dto->playerName);
        self::assertSame(300, $dto->score);
    }

    public function testEloRankingEntryDtoCoercion(): void
    {
        $dto = new EloRankingEntryDto(
            eloRating: '1250',
            gamesPlayed: '30',
            playerColor: '#ff0000',
            playerId: '4',
            playerName: 'Bob',
        );

        self::assertSame(1250, $dto->eloRating);
        self::assertSame(30, $dto->gamesPlayed);
        self::assertSame('#ff0000', $dto->playerColor);
        self::assertSame(4, $dto->playerId);
        self::assertSame('Bob', $dto->playerName);
    }

    public function testEloRankingEntryDtoWithNullColor(): void
    {
        $dto = new EloRankingEntryDto(
            eloRating: 1100,
            gamesPlayed: 5,
            playerColor: null,
            playerId: 9,
            playerName: 'Charlie',
        );

        self::assertNull($dto->playerColor);
        self::assertSame(1100, $dto->eloRating);
    }

    public function testTakerGameHighlightDtoCoercion(): void
    {
        $dto = new TakerGameHighlightDto(
            contract: Contract::GardeContre,
            gameId: '55',
            playerName: 'Diana',
            score: '250',
        );

        self::assertSame(Contract::GardeContre, $dto->contract);
        self::assertSame(55, $dto->gameId);
        self::assertSame('Diana', $dto->playerName);
        self::assertSame(250, $dto->score);
    }

    public function testPlayerExtremeScoreDtoCoercion(): void
    {
        $date = new \DateTimeImmutable('2026-02-20');
        $dto = new PlayerExtremeScoreDto(
            contract: Contract::Petite,
            date: $date,
            gameId: '101',
            score: '-200',
            sessionId: '8',
        );

        self::assertSame(Contract::Petite, $dto->contract);
        self::assertSame($date, $dto->date);
        self::assertSame(101, $dto->gameId);
        self::assertSame(-200, $dto->score);
        self::assertSame(8, $dto->sessionId);
    }

    public function testGameTakerScoreDtoWithBackedEnumCoercion(): void
    {
        $dto = new GameTakerScoreDto(
            completedAt: '2026-03-25 12:00:00',
            playerId: '1',
            gameId: '20',
            partnerId: '6',
            poignee: Poignee::Triple,
            poigneeOwner: Side::Attack,
            takerId: '3',
            takerScore: '180',
        );

        self::assertInstanceOf(\DateTimeImmutable::class, $dto->completedAt);
        self::assertSame(1, $dto->playerId);
        self::assertSame(20, $dto->gameId);
        self::assertSame(6, $dto->partnerId);
        self::assertSame('triple', $dto->poignee);
        self::assertSame('attack', $dto->poigneeOwner);
        self::assertSame(3, $dto->takerId);
        self::assertSame(180, $dto->takerScore);
    }

    public function testGameTakerScoreDtoWithNullPartner(): void
    {
        $date = new \DateTimeImmutable('2026-03-25');
        $dto = new GameTakerScoreDto(
            completedAt: $date,
            playerId: 2,
            gameId: 30,
            partnerId: null,
            poignee: Poignee::None,
            poigneeOwner: Side::None,
            takerId: 2,
            takerScore: 50,
        );

        self::assertSame($date, $dto->completedAt);
        self::assertNull($dto->partnerId);
        self::assertSame('none', $dto->poignee);
        self::assertSame('none', $dto->poigneeOwner);
    }

    public function testBestSessionTotalDtoWithStringDate(): void
    {
        $dto = new BestSessionTotalDto(
            firstDate: '2026-02-24 14:30:00',
            sessionId: '15',
            total: '500',
        );

        self::assertInstanceOf(\DateTimeImmutable::class, $dto->firstDate);
        self::assertSame('2026-02-24', $dto->firstDate->format('Y-m-d'));
        self::assertSame(15, $dto->sessionId);
        self::assertSame(500, $dto->total);
    }

    public function testBestSessionTotalDtoWithDateTimeImmutable(): void
    {
        $date = new \DateTimeImmutable('2026-03-01');
        $dto = new BestSessionTotalDto(
            firstDate: $date,
            sessionId: 22,
            total: -100,
        );

        self::assertSame($date, $dto->firstDate);
        self::assertSame(22, $dto->sessionId);
        self::assertSame(-100, $dto->total);
    }

    public function testBadgeDtoFromArrayAndJsonSerialize(): void
    {
        $data = [
            'description' => 'Jouer sa première partie',
            'emoji' => '🎮',
            'label' => 'Première partie',
            'type' => 'first_game',
        ];

        $dto = BadgeDto::fromArray($data);

        self::assertSame('Jouer sa première partie', $dto->description);
        self::assertSame('🎮', $dto->emoji);
        self::assertSame('Première partie', $dto->label);
        self::assertSame('first_game', $dto->type);

        $json = $dto->jsonSerialize();
        self::assertSame($data, $json);
    }

    public function testNewBadgesDtoFromAwardedBadgesAndJsonSerialize(): void
    {
        $awardedBadges = [
            1 => [BadgeType::FirstGame],
        ];

        $dto = NewBadgesDto::fromAwardedBadges($awardedBadges);

        $serialized = $dto->jsonSerialize();
        self::assertArrayHasKey(1, $serialized);
        self::assertCount(1, $serialized[1]);
        self::assertSame('first_game', $serialized[1][0]['type']);
    }
}
