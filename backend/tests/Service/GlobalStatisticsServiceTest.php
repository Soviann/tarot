<?php

declare(strict_types=1);

namespace App\Tests\Service;

use App\Dto\ContractCountByPlayerDto;
use App\Dto\ContractDistributionDto;
use App\Dto\ContractWinsByPlayerDto;
use App\Dto\DateRange;
use App\Dto\EloHistoryPointDto;
use App\Dto\EloRankingEntryDto;
use App\Dto\GamesPlayedCountDto;
use App\Dto\LeaderboardScoreDto;
use App\Dto\PlayerCountDto;
use App\Dto\PlayerWithCountDto;
use App\Enum\Contract;
use App\Repository\EloHistoryRepository;
use App\Repository\GameRepository;
use App\Repository\ScoreEntryRepository;
use App\Repository\SessionRepository;
use App\Repository\StarEventRepository;
use App\Service\GlobalStatisticsService;
use PHPUnit\Framework\MockObject\Stub;
use PHPUnit\Framework\TestCase;

final class GlobalStatisticsServiceTest extends TestCase
{
    private EloHistoryRepository&Stub $eloHistoryRepository;
    private GameRepository&Stub $gameRepository;
    private ScoreEntryRepository&Stub $scoreEntryRepository;
    private GlobalStatisticsService $service;
    private SessionRepository&Stub $sessionRepository;
    private StarEventRepository&Stub $starEventRepository;

    protected function setUp(): void
    {
        $this->eloHistoryRepository = $this->createStub(EloHistoryRepository::class);
        $this->gameRepository = $this->createStub(GameRepository::class);
        $this->scoreEntryRepository = $this->createStub(ScoreEntryRepository::class);
        $this->sessionRepository = $this->createStub(SessionRepository::class);
        $this->starEventRepository = $this->createStub(StarEventRepository::class);

        $this->service = new GlobalStatisticsService(
            $this->eloHistoryRepository,
            $this->gameRepository,
            $this->scoreEntryRepository,
            $this->sessionRepository,
            $this->starEventRepository,
        );
    }

    // ── getLeaderboard ──────────────────────────────────────────────────

    public function testLeaderboardMergesFourQueries(): void
    {
        $dateRange = new DateRange();

        $this->scoreEntryRepository->method('getLeaderboardScores')->willReturn([
            new LeaderboardScoreDto('#ff0000', 1, 'Alice', 500),
            new LeaderboardScoreDto('#0000ff', 2, 'Bob', 300),
        ]);

        $this->scoreEntryRepository->method('countGamesPlayedByPlayer')->willReturn([
            new GamesPlayedCountDto(10, 1),
            new GamesPlayedCountDto(8, 2),
        ]);

        $this->gameRepository->method('countTakerGames')->willReturn([
            new PlayerCountDto(5, 1),
            new PlayerCountDto(4, 2),
        ]);

        $this->gameRepository->method('countTakerWins')->willReturn([
            new PlayerCountDto(3, 1),
            new PlayerCountDto(2, 2),
        ]);

        $result = $this->service->getLeaderboard($dateRange);

        self::assertCount(2, $result);

        // Alice
        self::assertSame(5, $result[0]['gamesAsTaker']);
        self::assertSame(10, $result[0]['gamesPlayed']);
        self::assertSame('#ff0000', $result[0]['playerColor']);
        self::assertSame(1, $result[0]['playerId']);
        self::assertSame('Alice', $result[0]['playerName']);
        self::assertSame(500, $result[0]['totalScore']);
        self::assertSame(60.0, $result[0]['winRate']);
        self::assertSame(3, $result[0]['wins']);

        // Bob
        self::assertSame(4, $result[1]['gamesAsTaker']);
        self::assertSame(8, $result[1]['gamesPlayed']);
        self::assertSame('#0000ff', $result[1]['playerColor']);
        self::assertSame(2, $result[1]['playerId']);
        self::assertSame('Bob', $result[1]['playerName']);
        self::assertSame(300, $result[1]['totalScore']);
        self::assertSame(50.0, $result[1]['winRate']);
        self::assertSame(2, $result[1]['wins']);
    }

    public function testLeaderboardWinRateCalculation(): void
    {
        $this->scoreEntryRepository->method('getLeaderboardScores')->willReturn([
            new LeaderboardScoreDto('#ff0000', 1, 'Alice', 200),
        ]);
        $this->scoreEntryRepository->method('countGamesPlayedByPlayer')->willReturn([
            new GamesPlayedCountDto(10, 1),
        ]);
        $this->gameRepository->method('countTakerGames')->willReturn([
            new PlayerCountDto(3, 1),
        ]);
        $this->gameRepository->method('countTakerWins')->willReturn([
            new PlayerCountDto(2, 1),
        ]);

        $result = $this->service->getLeaderboard();

        // 2 / 3 * 100 = 66.666… → arrondi 66.7
        self::assertSame(66.7, $result[0]['winRate']);
    }

    public function testLeaderboardEmptyCase(): void
    {
        $this->scoreEntryRepository->method('getLeaderboardScores')->willReturn([]);

        $result = $this->service->getLeaderboard();

        self::assertSame([], $result);
    }

    public function testLeaderboardZeroTakerGames(): void
    {
        $this->scoreEntryRepository->method('getLeaderboardScores')->willReturn([
            new LeaderboardScoreDto('#ff0000', 1, 'Alice', 100),
        ]);
        $this->scoreEntryRepository->method('countGamesPlayedByPlayer')->willReturn([
            new GamesPlayedCountDto(5, 1),
        ]);
        $this->gameRepository->method('countTakerGames')->willReturn([]);
        $this->gameRepository->method('countTakerWins')->willReturn([]);

        $result = $this->service->getLeaderboard();

        self::assertSame(0, $result[0]['gamesAsTaker']);
        self::assertSame(0.0, $result[0]['winRate']);
        self::assertSame(0, $result[0]['wins']);
    }

    // ── getContractDistribution ─────────────────────────────────────────

    public function testContractDistributionWithPercentages(): void
    {
        $this->gameRepository->method('countCompleted')->willReturn(10);
        $this->gameRepository->method('getContractDistribution')->willReturn([
            new ContractDistributionDto(Contract::Petite, 7),
            new ContractDistributionDto(Contract::Garde, 3),
        ]);

        $result = $this->service->getContractDistribution();

        self::assertCount(2, $result);

        self::assertSame('petite', $result[0]['contract']);
        self::assertSame(7, $result[0]['count']);
        self::assertSame(70.0, $result[0]['percentage']);

        self::assertSame('garde', $result[1]['contract']);
        self::assertSame(3, $result[1]['count']);
        self::assertSame(30.0, $result[1]['percentage']);
    }

    public function testContractDistributionEmpty(): void
    {
        $this->gameRepository->method('countCompleted')->willReturn(0);

        $result = $this->service->getContractDistribution();

        self::assertSame([], $result);
    }

    // ── getContractSuccessRateByPlayer ───────────────────────────────────

    public function testContractSuccessRateByPlayer(): void
    {
        $this->gameRepository->method('getContractCountByPlayer')->willReturn([
            new ContractCountByPlayerDto(Contract::Petite, 4, '#ff0000', 1, 'Alice'),
            new ContractCountByPlayerDto(Contract::Garde, 3, '#ff0000', 1, 'Alice'),
        ]);

        $this->gameRepository->method('getContractWinsByPlayer')->willReturn([
            new ContractWinsByPlayerDto(Contract::Petite, 1, 3),
            // Pas de victoires en Garde pour Alice
        ]);

        $result = $this->service->getContractSuccessRateByPlayer();

        self::assertCount(1, $result);
        self::assertSame(1, $result[0]['id']);
        self::assertSame('Alice', $result[0]['name']);
        self::assertSame('#ff0000', $result[0]['color']);

        $contracts = $result[0]['contracts'];
        self::assertCount(2, $contracts);

        // Petite : 3 wins / 4 count = 75.0%
        self::assertSame('petite', $contracts[0]['contract']);
        self::assertSame(4, $contracts[0]['count']);
        self::assertSame(75.0, $contracts[0]['winRate']);
        self::assertSame(3, $contracts[0]['wins']);

        // Garde : 0 wins / 3 count = 0.0%
        self::assertSame('garde', $contracts[1]['contract']);
        self::assertSame(3, $contracts[1]['count']);
        self::assertSame(0.0, $contracts[1]['winRate']);
        self::assertSame(0, $contracts[1]['wins']);
    }

    public function testContractSuccessRateByPlayerEmpty(): void
    {
        $this->gameRepository->method('getContractCountByPlayer')->willReturn([]);

        $result = $this->service->getContractSuccessRateByPlayer();

        self::assertSame([], $result);
    }

    // ── getEloRanking ───────────────────────────────────────────────────

    public function testEloRankingMapping(): void
    {
        $this->eloHistoryRepository->method('getEloRanking')->willReturn([
            new EloRankingEntryDto(1600, 10, '#ff0000', 1, 'Alice'),
            new EloRankingEntryDto(1450, 5, '#0000ff', 2, 'Bob'),
        ]);

        $result = $this->service->getEloRanking();

        self::assertCount(2, $result);

        self::assertSame(1600, $result[0]['eloRating']);
        self::assertSame(10, $result[0]['gamesPlayed']);
        self::assertSame('#ff0000', $result[0]['playerColor']);
        self::assertSame(1, $result[0]['playerId']);
        self::assertSame('Alice', $result[0]['playerName']);

        self::assertSame(1450, $result[1]['eloRating']);
        self::assertSame(5, $result[1]['gamesPlayed']);
        self::assertSame('#0000ff', $result[1]['playerColor']);
        self::assertSame(2, $result[1]['playerId']);
        self::assertSame('Bob', $result[1]['playerName']);
    }

    // ── getAllPlayersEloHistory ──────────────────────────────────────────

    public function testEloHistoryGrouping(): void
    {
        $date1 = new \DateTimeImmutable('2026-01-01T10:00:00+00:00');
        $date2 = new \DateTimeImmutable('2026-01-02T10:00:00+00:00');
        $date3 = new \DateTimeImmutable('2026-01-01T11:00:00+00:00');
        $date4 = new \DateTimeImmutable('2026-01-02T11:00:00+00:00');

        $this->eloHistoryRepository->method('getAllPlayersHistory')->willReturn([
            new EloHistoryPointDto($date1, 1, '#ff0000', 1, 'Alice', 1520),
            new EloHistoryPointDto($date2, 2, '#ff0000', 1, 'Alice', 1540),
            new EloHistoryPointDto($date3, 1, '#0000ff', 2, 'Bob', 1480),
            new EloHistoryPointDto($date4, 2, '#0000ff', 2, 'Bob', 1500),
        ]);

        $result = $this->service->getAllPlayersEloHistory();

        self::assertCount(2, $result);

        // Alice
        self::assertSame(1, $result[0]['playerId']);
        self::assertSame('Alice', $result[0]['playerName']);
        self::assertSame('#ff0000', $result[0]['playerColor']);
        self::assertCount(2, $result[0]['history']);
        self::assertSame(1, $result[0]['history'][0]['gameId']);
        self::assertSame(1520, $result[0]['history'][0]['ratingAfter']);
        self::assertSame($date1->format(\DateTimeInterface::ATOM), $result[0]['history'][0]['date']);
        self::assertSame(2, $result[0]['history'][1]['gameId']);
        self::assertSame(1540, $result[0]['history'][1]['ratingAfter']);

        // Bob
        self::assertSame(2, $result[1]['playerId']);
        self::assertSame('Bob', $result[1]['playerName']);
        self::assertSame('#0000ff', $result[1]['playerColor']);
        self::assertCount(2, $result[1]['history']);
        self::assertSame(1, $result[1]['history'][0]['gameId']);
        self::assertSame(1480, $result[1]['history'][0]['ratingAfter']);
        self::assertSame(2, $result[1]['history'][1]['gameId']);
        self::assertSame(1500, $result[1]['history'][1]['ratingAfter']);
    }

    // ── Delegation methods ──────────────────────────────────────────────

    // ── getStarRanking ───────────────────────────────────────────────────

    public function testStarRankingMapping(): void
    {
        $this->starEventRepository->method('getStarRanking')->willReturn([
            new PlayerWithCountDto(5, '#ff0000', 1, 'Alice'),
            new PlayerWithCountDto(3, '#0000ff', 2, 'Bob'),
        ]);

        $result = $this->service->getStarRanking();

        self::assertCount(2, $result);

        self::assertSame('#ff0000', $result[0]['playerColor']);
        self::assertSame(1, $result[0]['playerId']);
        self::assertSame('Alice', $result[0]['playerName']);
        self::assertSame(5, $result[0]['stars']);

        self::assertSame('#0000ff', $result[1]['playerColor']);
        self::assertSame(2, $result[1]['playerId']);
        self::assertSame('Bob', $result[1]['playerName']);
        self::assertSame(3, $result[1]['stars']);
    }

    public function testStarRankingEmpty(): void
    {
        $this->starEventRepository->method('getStarRanking')->willReturn([]);

        $result = $this->service->getStarRanking();

        self::assertSame([], $result);
    }

    // ── Delegation methods ──────────────────────────────────────────────

    public function testDelegationMethods(): void
    {
        $dateRange = new DateRange(
            new \DateTimeImmutable('2026-01-01'),
            new \DateTimeImmutable('2026-01-31'),
        );
        $groupId = 42;

        $this->gameRepository->method('getAverageDurationSeconds')
            ->willReturn(120);

        $this->gameRepository->method('getTotalDurationSeconds')
            ->willReturn(36000);

        $this->gameRepository->method('countCompleted')
            ->willReturn(50);

        $this->sessionRepository->method('countAll')
            ->willReturn(10);

        $this->starEventRepository->method('countAll')
            ->willReturn(25);

        self::assertSame(120, $this->service->getAverageGameDurationSeconds($dateRange, $groupId));
        self::assertSame(36000, $this->service->getTotalPlayTimeSeconds($dateRange, $groupId));
        self::assertSame(50, $this->service->getTotalGames($dateRange, $groupId));
        self::assertSame(10, $this->service->getTotalSessions($dateRange, $groupId));
        self::assertSame(25, $this->service->getTotalStars($dateRange, $groupId));
    }
}
