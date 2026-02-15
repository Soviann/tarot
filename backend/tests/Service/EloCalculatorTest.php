<?php

declare(strict_types=1);

namespace App\Tests\Service;

use App\Entity\Game;
use App\Entity\Player;
use App\Entity\ScoreEntry;
use App\Entity\Session;
use App\Enum\Contract;
use App\Enum\GameStatus;
use App\Service\Scoring\EloCalculator;
use PHPUnit\Framework\TestCase;

class EloCalculatorTest extends TestCase
{
    private EloCalculator $calculator;

    /** @var Player[] */
    private array $players;

    private Session $session;

    protected function setUp(): void
    {
        $this->calculator = new EloCalculator();

        $this->players = [];
        $id = 1;
        foreach (['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'] as $name) {
            $player = new Player();
            $player->setName($name);

            $ref = new \ReflectionProperty(Player::class, 'id');
            $ref->setValue($player, $id++);

            $this->players[$name] = $player;
        }

        $this->session = new Session();
        foreach ($this->players as $player) {
            $this->session->addPlayer($player);
        }
    }

    /**
     * Tous à 1500, taker gagne → Δtaker = +20 (K=40), Δpartner = +12 (K=25), Δdefender ≈ -8 chacun (K=15).
     */
    public function testAllEqual1500TakerWins(): void
    {
        $game = $this->createGame(
            taker: $this->players['Alice'],
            partner: $this->players['Bob'],
            takerScore: 58,
        );

        $ratings = $this->buildRatings(1500);
        $result = $this->calculator->compute($game, $ratings);

        $indexed = $this->indexByPlayerName($result);

        // Taker (K=40): E=0.5, S=1 → Δ = 40 × 0.5 = 20
        $this->assertSame(20, $indexed['Alice']['ratingChange']);
        $this->assertSame(1520, $indexed['Alice']['ratingAfter']);

        // Partner (K=25): E=0.5, S=1 → Δ = 25 × 0.5 = 12.5 → 13 (PHP rounds half up)
        $this->assertSame(13, $indexed['Bob']['ratingChange']);

        // Defenders (K=15): E=0.5, S=0 → Δ = 15 × -0.5 ≈ -8 (rounded)
        $this->assertSame(-8, $indexed['Charlie']['ratingChange']);
        $this->assertSame(-8, $indexed['Diana']['ratingChange']);
        $this->assertSame(-8, $indexed['Eve']['ratingChange']);
    }

    /**
     * Tous à 1500, taker perd → symétrique.
     */
    public function testAllEqual1500TakerLoses(): void
    {
        $game = $this->createGame(
            taker: $this->players['Alice'],
            partner: $this->players['Bob'],
            takerScore: -58,
        );

        $ratings = $this->buildRatings(1500);
        $result = $this->calculator->compute($game, $ratings);

        $indexed = $this->indexByPlayerName($result);

        $this->assertSame(-20, $indexed['Alice']['ratingChange']);
        $this->assertSame(-13, $indexed['Bob']['ratingChange']);
        $this->assertSame(8, $indexed['Charlie']['ratingChange']);
        $this->assertSame(8, $indexed['Diana']['ratingChange']);
        $this->assertSame(8, $indexed['Eve']['ratingChange']);
    }

    /**
     * Taker 1800 vs défenseurs 1500 → gain plus faible pour le taker.
     */
    public function testHighTakerGainLessOnWin(): void
    {
        $game = $this->createGame(
            taker: $this->players['Alice'],
            partner: $this->players['Bob'],
            takerScore: 58,
        );

        $ratings = $this->buildRatings(1500);
        $ratings[$this->players['Alice']->getId()] = 1800;

        $result = $this->calculator->compute($game, $ratings);
        $indexed = $this->indexByPlayerName($result);

        // Taker at 1800 vs avg defense 1500 → E ≈ 0.849 → Δ = 40 × (1 - 0.849) ≈ 6
        $this->assertLessThan(20, $indexed['Alice']['ratingChange']);
        $this->assertGreaterThan(0, $indexed['Alice']['ratingChange']);
    }

    /**
     * Taker 1200 vs défenseurs 1500 → gain plus élevé pour le taker.
     */
    public function testLowTakerGainsMoreOnWin(): void
    {
        $game = $this->createGame(
            taker: $this->players['Alice'],
            partner: $this->players['Bob'],
            takerScore: 58,
        );

        $ratings = $this->buildRatings(1500);
        $ratings[$this->players['Alice']->getId()] = 1200;

        $result = $this->calculator->compute($game, $ratings);
        $indexed = $this->indexByPlayerName($result);

        // Taker at 1200 vs avg defense 1500 → E ≈ 0.151 → Δ = 40 × (1 - 0.151) ≈ 34
        $this->assertGreaterThan(20, $indexed['Alice']['ratingChange']);
    }

    /**
     * Sans partenaire (self-call) → K_TAKER et K_DEFENDER seulement, pas de K_PARTNER.
     */
    public function testSelfCallNoPartner(): void
    {
        $game = $this->createGame(
            taker: $this->players['Alice'],
            partner: null,
            takerScore: 100,
        );

        $ratings = $this->buildRatings(1500);
        $result = $this->calculator->compute($game, $ratings);

        $indexed = $this->indexByPlayerName($result);

        // Taker (K=40): E=0.5, S=1 → Δ = 20
        $this->assertSame(20, $indexed['Alice']['ratingChange']);

        // 4 defenders (K=15) each: Δ = -8
        $this->assertSame(-8, $indexed['Bob']['ratingChange']);
        $this->assertSame(-8, $indexed['Charlie']['ratingChange']);
        $this->assertSame(-8, $indexed['Diana']['ratingChange']);
        $this->assertSame(-8, $indexed['Eve']['ratingChange']);

        // No partner entry
        $this->assertCount(5, $result);
    }

    /**
     * Somme des Δ ≈ 0 (tolérance ±5 pour arrondi).
     */
    public function testSumOfDeltasNearZero(): void
    {
        $game = $this->createGame(
            taker: $this->players['Alice'],
            partner: $this->players['Bob'],
            takerScore: 58,
        );

        $ratings = [
            $this->players['Alice']->getId() => 1600,
            $this->players['Bob']->getId() => 1450,
            $this->players['Charlie']->getId() => 1550,
            $this->players['Diana']->getId() => 1400,
            $this->players['Eve']->getId() => 1500,
        ];

        $result = $this->calculator->compute($game, $ratings);

        $sumDelta = 0;
        foreach ($result as $entry) {
            $sumDelta += $entry['ratingChange'];
        }

        $this->assertEqualsWithDelta(0, $sumDelta, 10);
    }

    /**
     * Vérifie que ratingBefore et ratingAfter sont cohérents.
     */
    public function testRatingBeforeAndAfterConsistent(): void
    {
        $game = $this->createGame(
            taker: $this->players['Alice'],
            partner: $this->players['Bob'],
            takerScore: 58,
        );

        $ratings = $this->buildRatings(1500);
        $result = $this->calculator->compute($game, $ratings);

        foreach ($result as $entry) {
            $this->assertSame(
                $entry['ratingBefore'] + $entry['ratingChange'],
                $entry['ratingAfter'],
            );
        }
    }

    /**
     * @return array<int, int>
     */
    private function buildRatings(int $rating): array
    {
        $ratings = [];
        foreach ($this->players as $player) {
            $ratings[$player->getId()] = $rating;
        }

        return $ratings;
    }

    private function createGame(Player $taker, ?Player $partner, int $takerScore): Game
    {
        $game = new Game();
        $game->setContract(Contract::Petite);
        $game->setOudlers(2);
        $game->setPartner($partner);
        $game->setPoints(45.0);
        $game->setSession($this->session);
        $game->setStatus(GameStatus::Completed);
        $game->setTaker($taker);
        $game->setPosition(1);

        // Add score entries to determine win/loss
        foreach ($this->players as $name => $player) {
            $entry = new ScoreEntry();
            $entry->setGame($game);
            $entry->setPlayer($player);

            if ($player === $taker) {
                $entry->setScore($takerScore);
            } else {
                $entry->setScore($takerScore > 0 ? -(int) (\abs($takerScore) / 4) : (int) (\abs($takerScore) / 4));
            }

            $game->addScoreEntry($entry);
        }

        return $game;
    }

    /**
     * @param list<array{playerId: int, playerName: string, ratingAfter: int, ratingBefore: int, ratingChange: int}> $result
     *
     * @return array<string, array{playerId: int, playerName: string, ratingAfter: int, ratingBefore: int, ratingChange: int}>
     */
    private function indexByPlayerName(array $result): array
    {
        $indexed = [];
        foreach ($result as $entry) {
            $indexed[$entry['playerName']] = $entry;
        }

        return $indexed;
    }
}
