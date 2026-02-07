import {
  calculateScore,
  type ScoreCalculatorInput,
} from "../../services/scoreCalculator";
import { Chelem, Contract, Side } from "../../types/enums";

function makeInput(overrides: Partial<ScoreCalculatorInput> = {}): ScoreCalculatorInput {
  return {
    chelem: Chelem.None,
    contract: Contract.Petite,
    oudlers: 2,
    partnerId: 2,
    petitAuBout: Side.None,
    poignee: "none",
    points: 45,
    ...overrides,
  };
}

describe("calculateScore", () => {
  // ---------------------------------------------------------------
  // Cas de base
  // ---------------------------------------------------------------

  it("calcule une petite gagnée avec 2 oudlers", () => {
    // Petite, 2 oudlers, 45 pts → requis=41, base=(45-41+25)×1=29
    const result = calculateScore(makeInput());

    expect(result.attackWins).toBe(true);
    expect(result.baseScore).toBe(29);
    expect(result.takerScore).toBe(58);
    expect(result.partnerScore).toBe(29);
    expect(result.defenderScore).toBe(-29);
  });

  it("calcule une petite perdue sans oudler", () => {
    // Petite, 0 oudlers, 40 pts → requis=56, base=-(56-40+25)×1=-41
    const result = calculateScore(makeInput({ oudlers: 0, points: 40 }));

    expect(result.attackWins).toBe(false);
    expect(result.baseScore).toBe(-41);
    expect(result.takerScore).toBe(-82);
    expect(result.defenderScore).toBe(41);
  });

  it("calcule une garde gagnée avec 1 oudler", () => {
    // Garde, 1 oudler, 60 pts → requis=51, base=(60-51+25)×2=68
    const result = calculateScore(makeInput({ contract: Contract.Garde, oudlers: 1, points: 60 }));

    expect(result.attackWins).toBe(true);
    expect(result.baseScore).toBe(68);
    expect(result.takerScore).toBe(136);
  });

  it("calcule une garde sans gagnée avec 3 oudlers", () => {
    // GardeSans, 3 oudlers, 50 pts → requis=36, base=(50-36+25)×4=156
    const result = calculateScore(makeInput({ contract: Contract.GardeSans, oudlers: 3, points: 50 }));

    expect(result.baseScore).toBe(156);
    expect(result.takerScore).toBe(312);
  });

  it("calcule une garde contre perdue sans oudler", () => {
    // GardeContre, 0 oudlers, 30 pts → requis=56, base=-(56-30+25)×6=-306
    const result = calculateScore(makeInput({ contract: Contract.GardeContre, oudlers: 0, points: 30 }));

    expect(result.baseScore).toBe(-306);
    expect(result.takerScore).toBe(-612);
  });

  it("calcule les points exacts (juste le contrat)", () => {
    // Petite, 2 oudlers, 41 pts exactement → base=(0+25)×1=25
    const result = calculateScore(makeInput({ points: 41 }));

    expect(result.attackWins).toBe(true);
    expect(result.baseScore).toBe(25);
  });

  // ---------------------------------------------------------------
  // Bonus poignée
  // ---------------------------------------------------------------

  it("ajoute le bonus poignée au camp gagnant (attaque gagne)", () => {
    // Petite gagnée + poignée simple → +20
    // base=29, total=29+20=49
    const result = calculateScore(makeInput({ poignee: "simple" }));

    expect(result.poigneeBonus).toBe(20);
    expect(result.totalPerPlayer).toBe(49);
  });

  it("soustrait le bonus poignée quand l'attaque perd", () => {
    // Petite perdue + poignée double → -30
    // base=-41, total=-41-30=-71
    const result = calculateScore(makeInput({ oudlers: 0, poignee: "double", points: 40 }));

    expect(result.poigneeBonus).toBe(-30);
    expect(result.totalPerPlayer).toBe(-71);
  });

  // ---------------------------------------------------------------
  // Petit au bout
  // ---------------------------------------------------------------

  it("ajoute le petit au bout quand attaque joue et gagne", () => {
    // Garde, base=68, petit au bout=+10×2=+20, total=88
    const result = calculateScore(makeInput({
      contract: Contract.Garde,
      oudlers: 1,
      petitAuBout: Side.Attack,
      points: 60,
    }));

    expect(result.petitAuBoutBonus).toBe(20);
    expect(result.totalPerPlayer).toBe(88);
  });

  it("soustrait le petit au bout quand défense joue et attaque gagne", () => {
    // Garde, base=68, petit au bout=-10×2=-20, total=48
    const result = calculateScore(makeInput({
      contract: Contract.Garde,
      oudlers: 1,
      petitAuBout: Side.Defense,
      points: 60,
    }));

    expect(result.petitAuBoutBonus).toBe(-20);
    expect(result.totalPerPlayer).toBe(48);
  });

  it("soustrait le petit au bout quand attaque joue et perd", () => {
    // Petite, base=-41, petit au bout=-10×1=-10, total=-51
    const result = calculateScore(makeInput({
      oudlers: 0,
      petitAuBout: Side.Attack,
      points: 40,
    }));

    expect(result.petitAuBoutBonus).toBe(-10);
    expect(result.totalPerPlayer).toBe(-51);
  });

  it("soustrait le petit au bout quand défense joue et attaque perd", () => {
    // Petite, base=-41, petit au bout=-10×1=-10, total=-51
    const result = calculateScore(makeInput({
      oudlers: 0,
      petitAuBout: Side.Defense,
      points: 40,
    }));

    expect(result.petitAuBoutBonus).toBe(-10);
    expect(result.totalPerPlayer).toBe(-51);
  });

  // ---------------------------------------------------------------
  // Chelem
  // ---------------------------------------------------------------

  it("ajoute 400 pour un chelem annoncé gagné", () => {
    // GardeSans, 3 oudlers, 91 pts, chelem annoncé gagné
    // base=(91-36+25)×4=320, chelem=400, total=720
    const result = calculateScore(makeInput({
      chelem: Chelem.AnnouncedWon,
      contract: Contract.GardeSans,
      oudlers: 3,
      points: 91,
    }));

    expect(result.chelemBonus).toBe(400);
    expect(result.totalPerPlayer).toBe(720);
  });

  it("soustrait 200 pour un chelem annoncé perdu", () => {
    // GardeSans, 3 oudlers, 50 pts, chelem annoncé perdu
    // base=156, chelem=-200, total=-44
    const result = calculateScore(makeInput({
      chelem: Chelem.AnnouncedLost,
      contract: Contract.GardeSans,
      oudlers: 3,
      points: 50,
    }));

    expect(result.chelemBonus).toBe(-200);
    expect(result.totalPerPlayer).toBe(-44);
  });

  it("ajoute 200 pour un chelem non annoncé gagné", () => {
    // Garde, 3 oudlers, 91 pts, chelem non annoncé gagné
    // base=(91-36+25)×2=160, chelem=200, total=360
    const result = calculateScore(makeInput({
      chelem: Chelem.NotAnnouncedWon,
      contract: Contract.Garde,
      oudlers: 3,
      points: 91,
    }));

    expect(result.chelemBonus).toBe(200);
    expect(result.totalPerPlayer).toBe(360);
  });

  // ---------------------------------------------------------------
  // Distribution : self-call
  // ---------------------------------------------------------------

  it("distribue ×4 au preneur en self-call", () => {
    // Petite, 2 oudlers, 45 pts → base=29
    // preneur=29×4=116, défenseurs=-29
    const result = calculateScore(makeInput({ partnerId: null }));

    expect(result.takerScore).toBe(116);
    expect(result.partnerScore).toBe(0);
    expect(result.defenderScore).toBe(-29);
  });

  // ---------------------------------------------------------------
  // Distribution : avec partenaire
  // ---------------------------------------------------------------

  it("distribue ×2 preneur, ×1 partenaire avec partenaire", () => {
    // Petite, 2 oudlers, 45 pts → base=29
    // preneur=58, partenaire=29, défenseurs=-29
    const result = calculateScore(makeInput());

    expect(result.takerScore).toBe(58);
    expect(result.partnerScore).toBe(29);
    expect(result.defenderScore).toBe(-29);
  });

  // ---------------------------------------------------------------
  // Invariant : somme = 0
  // ---------------------------------------------------------------

  it.each([
    { desc: "petite gagnée avec partenaire", input: makeInput() },
    { desc: "petite perdue sans oudler", input: makeInput({ oudlers: 0, points: 40 }) },
    { desc: "garde gagnée", input: makeInput({ contract: Contract.Garde, oudlers: 1, points: 60 }) },
    { desc: "self-call gagné", input: makeInput({ partnerId: null }) },
    { desc: "self-call perdu", input: makeInput({ contract: Contract.Garde, oudlers: 0, partnerId: null, points: 30 }) },
    { desc: "tous les bonus", input: makeInput({
      chelem: Chelem.None,
      contract: Contract.Garde,
      oudlers: 1,
      petitAuBout: Side.Attack,
      poignee: "triple",
      points: 60,
    }) },
  ])("somme des scores = 0 pour $desc", ({ input }) => {
    const result = calculateScore(input);

    const selfCall = input.partnerId === null;
    const totalTaker = result.takerScore;
    const totalPartner = selfCall ? 0 : result.partnerScore;
    const numDefenders = selfCall ? 4 : 3;
    const sum = totalTaker + totalPartner + numDefenders * result.defenderScore;

    expect(sum).toBe(0);
  });
});
