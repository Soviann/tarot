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
  // Demi-points : arrondi FFT (½ point au camp gagnant)
  // ---------------------------------------------------------------

  it("arrondit le demi-point en faveur de l'attaque quand elle gagne (53.5 pts, 1 oudler)", () => {
    // 53.5 pts, requis=51 → attaque gagne → ceil(53.5)=54
    // base=(54-51+25)×2=56
    const result = calculateScore(makeInput({
      contract: Contract.Garde,
      oudlers: 1,
      points: 53.5,
    }));

    expect(result.attackWins).toBe(true);
    expect(result.baseScore).toBe(56);
    expect(result.takerScore).toBe(112);
  });

  it("arrondit le demi-point en faveur de la défense quand l'attaque perd (40.5 pts, 2 oudlers)", () => {
    // 40.5 pts, requis=41 → attaque perd → floor(40.5)=40
    // base=-(|40-41|+25)×1 = -26
    const result = calculateScore(makeInput({
      oudlers: 2,
      points: 40.5,
    }));

    expect(result.attackWins).toBe(false);
    expect(result.baseScore).toBe(-26);
  });

  it("arrondit le demi-point pour déterminer le résultat (41.5 pts, 2 oudlers → attaque gagne)", () => {
    // 41.5 pts, requis=41 → attaque gagne → ceil(41.5)=42
    // base=(42-41+25)×1=26
    const result = calculateScore(makeInput({
      oudlers: 2,
      points: 41.5,
    }));

    expect(result.attackWins).toBe(true);
    expect(result.baseScore).toBe(26);
  });

  it("les points entiers ne sont pas affectés par l'arrondi", () => {
    const result = calculateScore(makeInput({ points: 45 }));

    expect(result.attackWins).toBe(true);
    expect(result.baseScore).toBe(29);
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
  // Points aux bornes
  // ---------------------------------------------------------------

  it("calcule correctement avec 0 pts (borne basse)", () => {
    // Petite, 0 oudlers, 0 pts → requis=56, base=-(56-0+25)×1=-81
    const result = calculateScore(makeInput({ oudlers: 0, points: 0 }));

    expect(result.attackWins).toBe(false);
    expect(result.baseScore).toBe(-81);
  });

  it("calcule correctement avec 91 pts (borne haute)", () => {
    // Petite, 0 oudlers, 91 pts → requis=56, base=(91-56+25)×1=60
    const result = calculateScore(makeInput({ oudlers: 0, points: 91 }));

    expect(result.attackWins).toBe(true);
    expect(result.baseScore).toBe(60);
  });

  // ---------------------------------------------------------------
  // Tous les bonus combinés
  // ---------------------------------------------------------------

  it("combine triple poignée + petit au bout + chelem annoncé gagné (attaque gagne)", () => {
    // GardeContre, 3 oudlers, 91 pts, triple poignée, petit au bout attaque, chelem annoncé gagné
    // base=(91-36+25)×6=480, poignée=+40, petit=+10×6=+60, chelem=+400
    // total=480+40+60+400=980
    const result = calculateScore(makeInput({
      chelem: Chelem.AnnouncedWon,
      contract: Contract.GardeContre,
      oudlers: 3,
      petitAuBout: Side.Attack,
      poignee: "triple",
      points: 91,
    }));

    expect(result.attackWins).toBe(true);
    expect(result.baseScore).toBe(480);
    expect(result.poigneeBonus).toBe(40);
    expect(result.petitAuBoutBonus).toBe(60);
    expect(result.chelemBonus).toBe(400);
    expect(result.totalPerPlayer).toBe(980);
  });

  it("combine triple poignée + petit au bout défense + chelem annoncé perdu (attaque perd)", () => {
    // GardeContre, 0 oudlers, 0 pts, triple poignée, petit au bout défense, chelem annoncé perdu
    // base=-(56-0+25)×6=-486, poignée=-40, petit=-10×6=-60, chelem=-200
    // total=-486-40-60-200=-786
    const result = calculateScore(makeInput({
      chelem: Chelem.AnnouncedLost,
      contract: Contract.GardeContre,
      oudlers: 0,
      petitAuBout: Side.Defense,
      poignee: "triple",
      points: 0,
    }));

    expect(result.attackWins).toBe(false);
    expect(result.baseScore).toBe(-486);
    expect(result.poigneeBonus).toBe(-40);
    expect(result.petitAuBoutBonus).toBe(-60);
    expect(result.chelemBonus).toBe(-200);
    expect(result.totalPerPlayer).toBe(-786);
  });

  // ---------------------------------------------------------------
  // Score maximum et minimum théoriques
  // ---------------------------------------------------------------

  it("calcule le score maximum théorique (garde contre, 91 pts, 3 oudlers, tous bonus positifs)", () => {
    // GardeContre, 3 oudlers, 91 pts, triple poignée, petit au bout attaque, chelem annoncé gagné
    // base=(91-36+25)×6=480, poignée=+40, petit=+60, chelem=+400
    // total=980, preneur=980×2=1960
    const result = calculateScore(makeInput({
      chelem: Chelem.AnnouncedWon,
      contract: Contract.GardeContre,
      oudlers: 3,
      petitAuBout: Side.Attack,
      poignee: "triple",
      points: 91,
    }));

    expect(result.totalPerPlayer).toBe(980);
    expect(result.takerScore).toBe(1960);
  });

  it("calcule le score minimum théorique (garde contre, 0 pts, 0 oudlers, tous bonus négatifs)", () => {
    // GardeContre, 0 oudlers, 0 pts, triple poignée, petit au bout attaque (perd), chelem annoncé perdu
    // base=-(56-0+25)×6=-486, poignée=-40, petit=-10×6=-60, chelem=-200
    // total=-786, preneur=-786×2=-1572
    const result = calculateScore(makeInput({
      chelem: Chelem.AnnouncedLost,
      contract: Contract.GardeContre,
      oudlers: 0,
      petitAuBout: Side.Attack,
      poignee: "triple",
      points: 0,
    }));

    expect(result.totalPerPlayer).toBe(-786);
    expect(result.takerScore).toBe(-1572);
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
    { desc: "demi-point attaque gagne", input: makeInput({ points: 41.5 }) },
    { desc: "demi-point attaque perd", input: makeInput({ oudlers: 0, points: 40.5 }) },
    { desc: "tous les bonus", input: makeInput({
      chelem: Chelem.None,
      contract: Contract.Garde,
      oudlers: 1,
      petitAuBout: Side.Attack,
      poignee: "triple",
      points: 60,
    }) },
    { desc: "self-call + tous les bonus positifs", input: makeInput({
      chelem: Chelem.AnnouncedWon,
      contract: Contract.GardeContre,
      oudlers: 3,
      partnerId: null,
      petitAuBout: Side.Attack,
      poignee: "triple",
      points: 91,
    }) },
    { desc: "self-call + tous les bonus négatifs", input: makeInput({
      chelem: Chelem.AnnouncedLost,
      contract: Contract.GardeContre,
      oudlers: 0,
      partnerId: null,
      petitAuBout: Side.Attack,
      poignee: "triple",
      points: 0,
    }) },
    { desc: "borne basse 0 pts", input: makeInput({ oudlers: 0, points: 0 }) },
    { desc: "borne haute 91 pts", input: makeInput({ oudlers: 0, points: 91 }) },
    { desc: "garde contre + chelem non annoncé gagné + poignée double", input: makeInput({
      chelem: Chelem.NotAnnouncedWon,
      contract: Contract.GardeContre,
      oudlers: 3,
      petitAuBout: Side.Defense,
      poignee: "double",
      points: 91,
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
