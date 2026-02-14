<?php

declare(strict_types=1);

namespace App\Tests\Service;

use App\Entity\Game;
use App\Entity\Player;
use App\Entity\Session;
use App\Entity\StarEvent;
use App\Enum\Contract;
use App\Enum\GameStatus;
use App\Service\Scoring\ScoreCalculator;
use App\Service\SessionSummaryService;
use App\Tests\Api\ApiTestCase;

class SessionSummaryServiceTest extends ApiTestCase
{
    private SessionSummaryService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new SessionSummaryService($this->em);
    }

    public function testSummaryWithNoGamesReturnsEmpty(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');

        $summary = $this->service->getSummary($session);

        // ranking: all 5 players with score 0
        self::assertCount(5, $summary['ranking']);
        foreach ($summary['ranking'] as $rank) {
            self::assertSame(0, $rank['score']);
        }
        // All at position 1 (tied at 0)
        self::assertSame(1, $summary['ranking'][0]['position']);

        // scoreSpread
        self::assertSame(0, $summary['scoreSpread']);

        // highlights
        self::assertSame(0, $summary['highlights']['duration']);
        self::assertSame(0, $summary['highlights']['totalGames']);
        self::assertSame(0, $summary['highlights']['totalStars']);
        self::assertNull($summary['highlights']['bestGame']);
        self::assertNull($summary['highlights']['worstGame']);
        self::assertNull($summary['highlights']['mostPlayedContract']);

        // awards: empty because < 3 completed games
        self::assertSame([], $summary['awards']);
    }

    public function testSummaryWithCompletedGames(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();
        /** @var Player $alice */
        $alice = $players[0];
        /** @var Player $bob */
        $bob = $players[1];
        /** @var Player $charlie */
        $charlie = $players[2];

        $alice->setColor('#ff0000');
        $bob->setColor('#00ff00');
        $this->em->flush();

        $calculator = new ScoreCalculator();

        // Game 1: Alice takes Garde, wins (2 oudlers, 50 pts => required=41, base=(50-41+25)*2=68)
        // Taker score: 68*4=272 (self-call), defenders: -68 each
        $game1 = $this->createCompletedGame($session, $alice, null, Contract::Garde, 2, 50);
        $this->computeAndPersistScores($calculator, $game1);

        // Game 2: Bob takes Petite, loses (0 oudlers, 40 pts => required=56, base=-(56-40+25)*1=-41)
        // Taker score: -41*4=-164 (self-call), defenders: +41 each
        $game2 = $this->createCompletedGame($session, $bob, null, Contract::Petite, 0, 40);
        $this->computeAndPersistScores($calculator, $game2);

        // Game 3: Alice takes Garde Sans, wins (3 oudlers, 45 pts => required=36, base=(45-36+25)*4=136)
        // Taker score: 136*4=544, defenders: -136 each
        $game3 = $this->createCompletedGame($session, $alice, null, Contract::GardeSans, 3, 45);
        $this->computeAndPersistScores($calculator, $game3);

        // Add a star event
        $star = new StarEvent();
        $star->setPlayer($alice);
        $star->setSession($session);
        $this->em->persist($star);
        $this->em->flush();

        $summary = $this->service->getSummary($session);

        // -- ranking --
        self::assertCount(5, $summary['ranking']);
        // Alice took games 1 & 3 (won both): 272 + 544 = 816 as taker, + defender scores from game 2: +41
        // Total Alice: 272 + 544 + 41 = 857
        $aliceRank = $this->findRankByPlayerId($summary['ranking'], $alice->getId());
        self::assertSame(857, $aliceRank['score']);
        self::assertSame(1, $aliceRank['position']);
        self::assertSame('#ff0000', $aliceRank['playerColor']);

        // Bob took game 2 (lost): -164 as taker, + defender scores from games 1 & 3: -68 + -136 = -204
        // Total Bob: -164 + (-204) = -368
        $bobRank = $this->findRankByPlayerId($summary['ranking'], $bob->getId());
        self::assertSame(-368, $bobRank['score']);
        self::assertSame('#00ff00', $bobRank['playerColor']);

        // Charlie, Diana, Eve: all defenders, same scores: -68 + 41 + -136 = -163 each
        $charlieRank = $this->findRankByPlayerId($summary['ranking'], $charlie->getId());
        self::assertSame(-163, $charlieRank['score']);

        // scoreSpread
        self::assertSame($summary['ranking'][0]['score'] - $summary['ranking'][4]['score'], $summary['scoreSpread']);

        // -- highlights --
        // mvp = Alice
        self::assertSame($alice->getId(), $summary['highlights']['mvp']['playerId']);
        self::assertSame('Alice', $summary['highlights']['mvp']['playerName']);

        // lastPlace = Bob (lowest score)
        self::assertSame($bob->getId(), $summary['highlights']['lastPlace']['playerId']);

        // bestGame = game 3 (Alice, Garde Sans, taker score 544)
        self::assertNotNull($summary['highlights']['bestGame']);
        self::assertSame($game3->getId(), $summary['highlights']['bestGame']['gameId']);
        self::assertSame('Alice', $summary['highlights']['bestGame']['playerName']);
        self::assertSame('garde_sans', $summary['highlights']['bestGame']['contract']);
        self::assertSame(544, $summary['highlights']['bestGame']['score']);

        // worstGame = game 2 (Bob, Petite, taker score -164)
        self::assertNotNull($summary['highlights']['worstGame']);
        self::assertSame($game2->getId(), $summary['highlights']['worstGame']['gameId']);
        self::assertSame('Bob', $summary['highlights']['worstGame']['playerName']);
        self::assertSame('petite', $summary['highlights']['worstGame']['contract']);
        self::assertSame(-164, $summary['highlights']['worstGame']['score']);

        // mostPlayedContract: all 3 contracts played once each — tied. Just verify structure.
        self::assertNotNull($summary['highlights']['mostPlayedContract']);
        self::assertArrayHasKey('contract', $summary['highlights']['mostPlayedContract']);
        self::assertArrayHasKey('count', $summary['highlights']['mostPlayedContract']);

        // totalGames = 3
        self::assertSame(3, $summary['highlights']['totalGames']);

        // totalStars = 1
        self::assertSame(1, $summary['highlights']['totalStars']);

        // duration >= 0 (session just created, games completed nearly instantly)
        self::assertGreaterThanOrEqual(0, $summary['highlights']['duration']);

        // -- awards (>= 3 games, so awards are generated) --
        self::assertNotEmpty($summary['awards']);

        // Le Boucher: Alice (highest total taker scores: 272 + 544 = 816)
        $boucher = $this->findAwardByTitle($summary['awards'], 'Le Boucher');
        self::assertNotNull($boucher);
        self::assertSame($alice->getId(), $boucher['playerId']);

        // L'Eternel Defenseur: Charlie, Diana, or Eve (never took, 0 games as taker)
        $defenseur = $this->findAwardByTitle($summary['awards'], "L'\u{00C9}ternel D\u{00E9}fenseur");
        self::assertNotNull($defenseur);
        // Must be one of Charlie/Diana/Eve (0 takes each)
        self::assertContains($defenseur['playerId'], [
            $charlie->getId(),
            $players[3]->getId(), // Diana
            $players[4]->getId(), // Eve
        ]);

        // Le Flambeur: Alice (1 Garde Sans, Bob has 0)
        $flambeur = $this->findAwardByTitle($summary['awards'], 'Le Flambeur');
        self::assertNotNull($flambeur);
        self::assertSame($alice->getId(), $flambeur['playerId']);
    }

    public function testSummaryWithFewerThanThreeGamesHasNoAwards(): void
    {
        $session = $this->createSessionWithPlayers('Alice', 'Bob', 'Charlie', 'Diana', 'Eve');
        $players = $session->getPlayers()->toArray();
        $calculator = new ScoreCalculator();

        // Only 2 completed games
        $game1 = $this->createCompletedGame($session, $players[0], null, Contract::Garde, 2, 50);
        $this->computeAndPersistScores($calculator, $game1);

        $game2 = $this->createCompletedGame($session, $players[1], null, Contract::Petite, 0, 40);
        $this->computeAndPersistScores($calculator, $game2);

        $summary = $this->service->getSummary($session);

        self::assertSame([], $summary['awards']);
        self::assertSame(2, $summary['highlights']['totalGames']);
    }

    private function createCompletedGame(
        Session $session,
        Player $taker,
        ?Player $partner,
        Contract $contract,
        int $oudlers,
        float $points,
    ): Game {
        $game = new Game();
        $game->setContract($contract);
        $game->setOudlers($oudlers);
        $game->setPartner($partner);
        $game->setPoints($points);
        $game->setPosition($session->getGames()->count() + 1);
        $game->setSession($session);
        $game->setStatus(GameStatus::Completed);
        $game->setCompletedAt(new \DateTimeImmutable());
        $game->setTaker($taker);
        $session->addGame($game);
        $this->em->persist($game);
        $this->em->flush();

        return $game;
    }

    private function computeAndPersistScores(ScoreCalculator $calculator, Game $game): void
    {
        foreach ($calculator->compute($game) as $entry) {
            $entry->setSession($game->getSession());
            $this->em->persist($entry);
            $game->addScoreEntry($entry);
        }
        $this->em->flush();
    }

    /**
     * @param list<array{playerId: int, playerName: string, playerColor: string|null, score: int, position: int}> $ranking
     *
     * @return array{playerId: int, playerName: string, playerColor: string|null, score: int, position: int}
     */
    private function findRankByPlayerId(array $ranking, ?int $playerId): array
    {
        foreach ($ranking as $rank) {
            if ($rank['playerId'] === $playerId) {
                return $rank;
            }
        }

        self::fail("Player ID {$playerId} not found in ranking.");
    }

    /**
     * @param list<array{title: string, description: string, playerId: int, playerName: string, playerColor: string|null}> $awards
     *
     * @return array{title: string, description: string, playerId: int, playerName: string, playerColor: string|null}|null
     */
    private function findAwardByTitle(array $awards, string $title): ?array
    {
        foreach ($awards as $award) {
            if ($award['title'] === $title) {
                return $award;
            }
        }

        return null;
    }
}
