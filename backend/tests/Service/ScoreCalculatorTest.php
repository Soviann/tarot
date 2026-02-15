<?php

declare(strict_types=1);

namespace App\Tests\Service;

use App\Entity\Game;
use App\Entity\Player;
use App\Entity\ScoreEntry;
use App\Entity\Session;
use App\Enum\Chelem;
use App\Enum\Contract;
use App\Enum\Poignee;
use App\Enum\Side;
use App\Service\Scoring\ScoreCalculator;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;

class ScoreCalculatorTest extends TestCase
{
    private ScoreCalculator $calculator;

    /** @var Player[] */
    private array $players;

    private Session $session;

    protected function setUp(): void
    {
        $this->calculator = new ScoreCalculator();

        $this->players = [];
        foreach (['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'] as $name) {
            $player = new Player();
            $player->setName($name);
            $this->players[] = $player;
        }

        $this->session = new Session();
        foreach ($this->players as $player) {
            $this->session->addPlayer($player);
        }
    }

    // ---------------------------------------------------------------
    // Cas de base
    // ---------------------------------------------------------------

    public function testPetiteGagneeAvecDeuxOudlers(): void
    {
        // Petite, 2 oudlers, 45 pts → requis=41, base=(45-41+25)×1=29
        $game = $this->createGame(
            contract: Contract::Petite,
            oudlers: 2,
            points: 45,
        );

        $entries = $this->calculator->compute($game);

        $this->assertTakerScore(29, $entries);
    }

    public function testPetitePerdueSansOudler(): void
    {
        // Petite, 0 oudlers, 40 pts → requis=56, base=-(56-40+25)×1=-41
        $game = $this->createGame(
            contract: Contract::Petite,
            oudlers: 0,
            points: 40,
        );

        $entries = $this->calculator->compute($game);

        $this->assertTakerScore(-41, $entries);
    }

    public function testGardeGagneeAvecUnOudler(): void
    {
        // Garde, 1 oudler, 60 pts → requis=51, base=(60-51+25)×2=68
        $game = $this->createGame(
            contract: Contract::Garde,
            oudlers: 1,
            points: 60,
        );

        $entries = $this->calculator->compute($game);

        $this->assertTakerScore(68, $entries);
    }

    public function testGardeSansGagneeAvecTroisOudlers(): void
    {
        // GardeSans, 3 oudlers, 50 pts → requis=36, base=(50-36+25)×4=156
        $game = $this->createGame(
            contract: Contract::GardeSans,
            oudlers: 3,
            points: 50,
        );

        $entries = $this->calculator->compute($game);

        $this->assertTakerScore(156, $entries);
    }

    public function testGardeContrePerdueSansOudler(): void
    {
        // GardeContre, 0 oudlers, 30 pts → requis=56, base=-(56-30+25)×6=-306
        $game = $this->createGame(
            contract: Contract::GardeContre,
            oudlers: 0,
            points: 30,
        );

        $entries = $this->calculator->compute($game);

        $this->assertTakerScore(-306, $entries);
    }

    public function testPointsExacts(): void
    {
        // Petite, 2 oudlers, 41 pts exactement → base=(0+25)×1=25
        $game = $this->createGame(
            contract: Contract::Petite,
            oudlers: 2,
            points: 41,
        );

        $entries = $this->calculator->compute($game);

        $this->assertTakerScore(25, $entries);
    }

    // ---------------------------------------------------------------
    // Bonus poignée
    // ---------------------------------------------------------------

    public function testPoigneeSimpleCampGagnant(): void
    {
        // Petite gagnée + poignée simple montrée par l'attaque → +20
        // base=(45-41+25)×1=29, total=29+20=49
        $game = $this->createGame(
            contract: Contract::Petite,
            oudlers: 2,
            points: 45,
            poignee: Poignee::Simple,
            poigneeOwner: Side::Attack,
        );

        $entries = $this->calculator->compute($game);

        $this->assertTakerScore(49, $entries);
    }

    public function testPoigneeCampPerdant(): void
    {
        // Petite gagnée par l'attaque, poignée montrée par la défense
        // La poignée va au camp gagnant (attaque) → +20 pour l'attaque
        // base=29, total=29+20=49
        $game = $this->createGame(
            contract: Contract::Petite,
            oudlers: 2,
            points: 45,
            poignee: Poignee::Simple,
            poigneeOwner: Side::Defense,
        );

        $entries = $this->calculator->compute($game);

        $this->assertTakerScore(49, $entries);
    }

    public function testPoigneeDoubleCampPerdant(): void
    {
        // Petite perdue + poignée double montrée par l'attaque
        // La poignée va au camp gagnant (défense) → -30 pour l'attaque
        // base=-41, total=-41-30=-71
        $game = $this->createGame(
            contract: Contract::Petite,
            oudlers: 0,
            points: 40,
            poignee: Poignee::Double,
            poigneeOwner: Side::Attack,
        );

        $entries = $this->calculator->compute($game);

        $this->assertTakerScore(-71, $entries);
    }

    // ---------------------------------------------------------------
    // Bonus petit au bout
    // ---------------------------------------------------------------

    public function testPetitAuBoutAttaqueGagnee(): void
    {
        // Petit au bout joué par l'attaque, attaque gagne → +10 × multiplier
        // Garde, base=68, petit au bout=+10×2=+20, total=88
        $game = $this->createGame(
            contract: Contract::Garde,
            oudlers: 1,
            points: 60,
            petitAuBout: Side::Attack,
        );

        $entries = $this->calculator->compute($game);

        $this->assertTakerScore(88, $entries);
    }

    public function testPetitAuBoutDefensePreneurGagne(): void
    {
        // Petit au bout joué par la défense, mais attaque gagne
        // → -10 × multiplier pour l'attaque (la défense l'a joué, mais elle a perdu)
        // Garde, base=68, petit au bout=-10×2=-20, total=48
        $game = $this->createGame(
            contract: Contract::Garde,
            oudlers: 1,
            points: 60,
            petitAuBout: Side::Defense,
        );

        $entries = $this->calculator->compute($game);

        $this->assertTakerScore(48, $entries);
    }

    public function testPetitAuBoutAttaquePerdue(): void
    {
        // Petit au bout joué par l'attaque, mais attaque perd
        // → négatif pour l'attaque : -10 × multiplier
        // Petite, base=-41, petit au bout=-10×1=-10, total=-51
        $game = $this->createGame(
            contract: Contract::Petite,
            oudlers: 0,
            points: 40,
            petitAuBout: Side::Attack,
        );

        $entries = $this->calculator->compute($game);

        $this->assertTakerScore(-51, $entries);
    }

    public function testPetitAuBoutDefenseAttaquePerdue(): void
    {
        // Petit au bout joué par la défense, attaque perd
        // → +10 × multiplier pour la défense (positif pour défense = négatif pour attaque... non)
        // La défense joue le petit au bout ET gagne → bonus positif pour la défense
        // Du point de vue attaque : base=-41, petit au bout=+10×1=+10 (au bénéfice de la défense = -10 pour attaque)
        // Attends, reformulons : petit au bout = 10 × multiplier, signé selon que le camp qui l'a joué gagne ou non
        // Défense l'a joué, défense gagne → bonus positif pour la défense = négatif pour l'attaque
        // base=-41, petit au bout ajouté au total = -10×1, total=-51
        // Non, c'est le même signe : si la défense joue et gagne, c'est négatif pour le preneur
        // Petite, base=-41, petit au bout=-10×1=-10, total=-51
        // Hmm, attendons : Defense joue le petit au bout, attaque perd
        // → le camp qui a joué le petit au bout GAGNE → +10×mult pour ce camp
        // → Pour l'attaque c'est négatif : -10×mult
        // total = -41 + (-10) = -51
        $game = $this->createGame(
            contract: Contract::Petite,
            oudlers: 0,
            points: 40,
            petitAuBout: Side::Defense,
        );

        $entries = $this->calculator->compute($game);

        $this->assertTakerScore(-51, $entries);
    }

    // ---------------------------------------------------------------
    // Bonus chelem
    // ---------------------------------------------------------------

    public function testChelemAnnonceGagne(): void
    {
        // GardeSans, 3 oudlers, 91 pts, chelem annoncé gagné → +400
        // base=(91-36+25)×4=320, chelem=+400, total=720
        $game = $this->createGame(
            contract: Contract::GardeSans,
            oudlers: 3,
            points: 91,
            chelem: Chelem::AnnouncedWon,
        );

        $entries = $this->calculator->compute($game);

        $this->assertTakerScore(720, $entries);
    }

    public function testChelemAnnoncePerdu(): void
    {
        // GardeSans, 3 oudlers, 50 pts, chelem annoncé perdu → -200
        // base=(50-36+25)×4=156, chelem=-200, total=-44
        $game = $this->createGame(
            contract: Contract::GardeSans,
            oudlers: 3,
            points: 50,
            chelem: Chelem::AnnouncedLost,
        );

        $entries = $this->calculator->compute($game);

        $this->assertTakerScore(-44, $entries);
    }

    public function testChelemNonAnnonceGagne(): void
    {
        // Garde, 3 oudlers, 91 pts, chelem non annoncé gagné → +200
        // base=(91-36+25)×2=160, chelem=+200, total=360
        $game = $this->createGame(
            contract: Contract::Garde,
            oudlers: 3,
            points: 91,
            chelem: Chelem::NotAnnouncedWon,
        );

        $entries = $this->calculator->compute($game);

        $this->assertTakerScore(360, $entries);
    }

    // ---------------------------------------------------------------
    // Distribution : self-call (sans partenaire)
    // ---------------------------------------------------------------

    public function testSelfCall(): void
    {
        // Sans partenaire → preneur ×4, chaque défenseur ×-1
        // Petite, 2 oudlers, 45 pts → base=29
        // preneur=29×4=116, chaque défenseur=29×(-1)=-29
        $game = $this->createGame(
            contract: Contract::Petite,
            oudlers: 2,
            points: 45,
            useDefaultPartner: false,
        );

        $entries = $this->calculator->compute($game);

        $scores = $this->extractScores($entries);
        // Preneur (Alice) = 116
        $this->assertSame(116, $scores['Alice']);
        // Chaque défenseur = -29
        $this->assertSame(-29, $scores['Bob']);
        $this->assertSame(-29, $scores['Charlie']);
        $this->assertSame(-29, $scores['Diana']);
        $this->assertSame(-29, $scores['Eve']);
    }

    // ---------------------------------------------------------------
    // Distribution : avec partenaire
    // ---------------------------------------------------------------

    public function testDistributionAvecPartenaire(): void
    {
        // Avec partenaire → preneur ×2, partenaire ×1, 3 défenseurs ×-1
        // Petite, 2 oudlers, 45 pts → base=29
        // preneur=58, partenaire=29, chaque défenseur=-29
        $game = $this->createGame(
            contract: Contract::Petite,
            oudlers: 2,
            points: 45,
        );

        $entries = $this->calculator->compute($game);

        $scores = $this->extractScores($entries);
        // Preneur (Alice) = 58
        $this->assertSame(58, $scores['Alice']);
        // Partenaire (Bob) = 29
        $this->assertSame(29, $scores['Bob']);
        // Défenseurs = -29
        $this->assertSame(-29, $scores['Charlie']);
        $this->assertSame(-29, $scores['Diana']);
        $this->assertSame(-29, $scores['Eve']);
    }

    // ---------------------------------------------------------------
    // Bonus combinés
    // ---------------------------------------------------------------

    public function testBonusMultiplesCombines(): void
    {
        // Garde gagnée, 1 oudler, 60 pts + poignée triple (attaque) + petit au bout (attaque)
        // base=(60-51+25)×2=68
        // poignée triple = +40 (camp gagnant = attaque)
        // petit au bout = +10×2 = +20 (attaque joue et gagne)
        // total = 68 + 40 + 20 = 128
        $game = $this->createGame(
            contract: Contract::Garde,
            oudlers: 1,
            points: 60,
            petitAuBout: Side::Attack,
            poignee: Poignee::Triple,
            poigneeOwner: Side::Attack,
        );

        $entries = $this->calculator->compute($game);

        $this->assertTakerScore(128, $entries);
    }

    // ---------------------------------------------------------------
    // Invariant : somme des scores = 0
    // ---------------------------------------------------------------

    #[DataProvider('gameProvider')]
    public function testSommeDesScoresEstZero(
        Contract $contract,
        int $oudlers,
        float $points,
        bool $selfCall,
        Poignee $poignee,
        Side $poigneeOwner,
        Side $petitAuBout,
        Chelem $chelem,
    ): void {
        $game = $this->createGame(
            chelem: $chelem,
            contract: $contract,
            oudlers: $oudlers,
            petitAuBout: $petitAuBout,
            poignee: $poignee,
            poigneeOwner: $poigneeOwner,
            points: $points,
            useDefaultPartner: !$selfCall,
        );

        $entries = $this->calculator->compute($game);

        $sum = \array_sum(\array_map(static fn (ScoreEntry $e) => $e->getScore(), $entries));
        $this->assertSame(0, $sum, \sprintf(
            'La somme des scores doit être 0, obtenu %d (contrat=%s, oudlers=%d, pts=%.1f)',
            $sum,
            $contract->value,
            $oudlers,
            $points,
        ));
    }

    /**
     * @return iterable<string, array{Contract, int, float, bool, Poignee, Side, Side, Chelem}>
     */
    public static function gameProvider(): iterable
    {
        yield 'petite gagnée avec partenaire' => [
            Contract::Petite, 2, 45, false, Poignee::None, Side::None, Side::None, Chelem::None,
        ];

        yield 'petite perdue sans oudler' => [
            Contract::Petite, 0, 40, false, Poignee::None, Side::None, Side::None, Chelem::None,
        ];

        yield 'garde gagnée' => [
            Contract::Garde, 1, 60, false, Poignee::None, Side::None, Side::None, Chelem::None,
        ];

        yield 'garde sans gagnée' => [
            Contract::GardeSans, 3, 50, false, Poignee::None, Side::None, Side::None, Chelem::None,
        ];

        yield 'garde contre perdue' => [
            Contract::GardeContre, 0, 30, false, Poignee::None, Side::None, Side::None, Chelem::None,
        ];

        yield 'self-call gagné' => [
            Contract::Petite, 2, 45, true, Poignee::None, Side::None, Side::None, Chelem::None,
        ];

        yield 'self-call perdu' => [
            Contract::Garde, 0, 30, true, Poignee::None, Side::None, Side::None, Chelem::None,
        ];

        yield 'avec poignée simple' => [
            Contract::Garde, 1, 60, false, Poignee::Simple, Side::Attack, Side::None, Chelem::None,
        ];

        yield 'avec poignée double camp perdant' => [
            Contract::Petite, 0, 40, false, Poignee::Double, Side::Attack, Side::None, Chelem::None,
        ];

        yield 'avec petit au bout attaque' => [
            Contract::Garde, 1, 60, false, Poignee::None, Side::None, Side::Attack, Chelem::None,
        ];

        yield 'avec petit au bout défense perdue' => [
            Contract::Petite, 0, 40, false, Poignee::None, Side::None, Side::Defense, Chelem::None,
        ];

        yield 'chelem annoncé gagné' => [
            Contract::GardeSans, 3, 91, false, Poignee::None, Side::None, Side::None, Chelem::AnnouncedWon,
        ];

        yield 'chelem annoncé perdu' => [
            Contract::GardeSans, 3, 50, false, Poignee::None, Side::None, Side::None, Chelem::AnnouncedLost,
        ];

        yield 'chelem non annoncé gagné' => [
            Contract::Garde, 3, 91, false, Poignee::None, Side::None, Side::None, Chelem::NotAnnouncedWon,
        ];

        yield 'tous les bonus combinés' => [
            Contract::Garde, 1, 60, false, Poignee::Triple, Side::Attack, Side::Attack, Chelem::None,
        ];

        yield 'self-call avec tous les bonus' => [
            Contract::GardeSans, 3, 91, true, Poignee::Simple, Side::Attack, Side::Attack, Chelem::AnnouncedWon,
        ];
    }

    // ---------------------------------------------------------------
    // Garde-fou : oudlers invalide
    // ---------------------------------------------------------------

    public function testThrowsOnInvalidOudlersCount(): void
    {
        $game = $this->createGame(
            contract: Contract::Petite,
            oudlers: 5,
            points: 45,
        );

        $this->expectException(\InvalidArgumentException::class);
        $this->calculator->compute($game);
    }

    // ---------------------------------------------------------------
    // Helpers
    // ---------------------------------------------------------------

    private function createGame(
        Contract $contract,
        int $oudlers,
        float $points,
        Chelem $chelem = Chelem::None,
        ?Player $partner = null,
        bool $useDefaultPartner = true,
        Side $petitAuBout = Side::None,
        Poignee $poignee = Poignee::None,
        Side $poigneeOwner = Side::None,
    ): Game {
        if ($useDefaultPartner && null === $partner) {
            $partner = $this->players[1];
        }

        return $this->createFullGame(
            chelem: $chelem,
            contract: $contract,
            oudlers: $oudlers,
            partner: $partner,
            petitAuBout: $petitAuBout,
            poignee: $poignee,
            poigneeOwner: $poigneeOwner,
            points: $points,
        );
    }

    private function createFullGame(
        Chelem $chelem,
        Contract $contract,
        int $oudlers,
        ?Player $partner,
        Side $petitAuBout,
        Poignee $poignee,
        Side $poigneeOwner,
        float $points,
    ): Game {
        $game = new Game();
        $game->setChelem($chelem);
        $game->setContract($contract);
        $game->setOudlers($oudlers);
        $game->setPartner($partner);
        $game->setPetitAuBout($petitAuBout);
        $game->setPoignee($poignee);
        $game->setPoigneeOwner($poigneeOwner);
        $game->setPoints($points);
        $game->setPosition(1);
        $game->setSession($this->session);
        $game->setTaker($this->players[0]); // Alice est toujours le preneur

        return $game;
    }

    /**
     * Vérifie le score individuel du preneur (basé sur la formule ×2 avec partenaire).
     * Utilise le score du preneur (Alice).
     *
     * @param ScoreEntry[] $entries
     */
    private function assertTakerScore(int $expectedBaseScore, array $entries): void
    {
        $scores = $this->extractScores($entries);

        // Avec partenaire (défaut) : preneur = base × 2
        $expectedTakerScore = $expectedBaseScore * 2;
        $this->assertSame($expectedTakerScore, $scores['Alice'], \sprintf(
            'Score preneur attendu %d (base %d × 2), obtenu %d',
            $expectedTakerScore,
            $expectedBaseScore,
            $scores['Alice'],
        ));
    }

    /**
     * @param ScoreEntry[] $entries
     *
     * @return array<string, int>
     */
    private function extractScores(array $entries): array
    {
        $scores = [];
        foreach ($entries as $entry) {
            $scores[$entry->getPlayer()->getName()] = $entry->getScore();
        }

        return $scores;
    }
}
