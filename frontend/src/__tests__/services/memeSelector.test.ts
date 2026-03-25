import { buildPool, selectMeme } from "../../services/memeSelector";
import type { GameContext } from "../../services/memeSelector";
import { Chelem, Contract, Side } from "../../types/enums";

vi.mock("../../services/doomWeek", () => ({
  isDoomWeek: vi.fn(() => false),
}));

import { isDoomWeek } from "../../services/doomWeek";
const mockIsDoomWeek = vi.mocked(isDoomWeek);

function makeContext(overrides: Partial<GameContext> = {}): GameContext {
  return {
    attackWins: true,
    chelem: Chelem.None,
    consecutiveLosses: 0,
    contract: Contract.Petite,
    isSelfCall: false,
    oudlers: 0,
    petitAuBout: Side.None,
    points: 51,
    previousScore: null,
    takerScore: 50,
    ...overrides,
  };
}

function poolIds(ctx: GameContext): string[] {
  return buildPool(ctx).map((entry) => entry.meme.id);
}

function poolWeight(ctx: GameContext, id: string): number | undefined {
  return buildPool(ctx).find((entry) => entry.meme.id === id)?.weight;
}

// --- buildPool ---

describe("buildPool", () => {
  describe("victory", () => {
    it("includes only base victory pool for a basic win", () => {
      const ids = poolIds(makeContext());

      expect(ids).toEqual(["borat", "champions", "dicaprio-toast", "over-9000", "pacha"]);
    });

    it("all base victory memes have weight 1", () => {
      const pool = buildPool(makeContext());

      expect(pool.every((entry) => entry.weight === 1)).toBe(true);
    });

    it("includes success-kid (weight 10) on petit au bout attack", () => {
      expect(poolWeight(makeContext({ petitAuBout: Side.Attack }), "success-kid")).toBe(10);
    });

    it("does NOT include success-kid on petit au bout defense", () => {
      expect(poolIds(makeContext({ petitAuBout: Side.Defense }))).not.toContain("success-kid");
    });

    it("includes obama-medal (weight 40) on self-call win", () => {
      expect(poolWeight(makeContext({ isSelfCall: true }), "obama-medal")).toBe(40);
    });

    it("includes both success-kid and obama-medal when both conditions met", () => {
      const ids = poolIds(makeContext({ isSelfCall: true, petitAuBout: Side.Attack }));

      expect(ids).toContain("success-kid");
      expect(ids).toContain("obama-medal");
    });
  });

  describe("defeat", () => {
    it("includes only base defeat pool for a basic loss", () => {
      const ids = poolIds(makeContext({ attackWins: false }));

      expect(ids).toEqual(["ah-shit", "just-to-suffer", "sad-pablo", "this-is-fine"]);
    });

    it("all base defeat memes have weight 1", () => {
      const pool = buildPool(makeContext({ attackWins: false }));

      expect(pool.every((entry) => entry.weight === 1)).toBe(true);
    });

    it("includes improbable defeat memes on 3 bouts loss", () => {
      const ids = poolIds(makeContext({ attackWins: false, oudlers: 3 }));

      expect(ids).toContain("chosen-one");
      expect(ids).toContain("picard-facepalm");
      expect(ids).toContain("pikachu-surprised");
    });

    it("improbable defeat memes have correct weights", () => {
      const ctx = makeContext({ attackWins: false, oudlers: 3 });

      expect(poolWeight(ctx, "chosen-one")).toBe(30);
      expect(poolWeight(ctx, "picard-facepalm")).toBe(20);
      expect(poolWeight(ctx, "pikachu-surprised")).toBe(10);
    });

    it("includes improbable defeat memes on chelem raté", () => {
      expect(poolIds(makeContext({ attackWins: false, chelem: Chelem.AnnouncedLost }))).toContain("chosen-one");
    });

    it("includes improbable defeat memes on garde contre loss", () => {
      expect(poolIds(makeContext({ attackWins: false, contract: Contract.GardeContre }))).toContain("chosen-one");
    });

    it("does NOT include improbable defeat memes on 2 bouts loss", () => {
      expect(poolIds(makeContext({ attackWins: false, oudlers: 2 }))).not.toContain("chosen-one");
    });

    it("does NOT include improbable defeat memes on chelem won", () => {
      expect(poolIds(makeContext({ attackWins: false, chelem: Chelem.AnnouncedWon }))).not.toContain("chosen-one");
    });

    it("includes crying-jordan (weight 20) on garde sans loss", () => {
      expect(poolWeight(makeContext({ attackWins: false, contract: Contract.GardeSans }), "crying-jordan")).toBe(20);
    });

    it("does NOT include crying-jordan on petite loss", () => {
      expect(poolIds(makeContext({ attackWins: false }))).not.toContain("crying-jordan");
    });

    it("includes both improbable and crying-jordan when garde sans + 3 bouts", () => {
      const ids = poolIds(makeContext({ attackWins: false, contract: Contract.GardeSans, oudlers: 3 }));

      expect(ids).toContain("chosen-one");
      expect(ids).toContain("crying-jordan");
    });
  });

  describe("special — mind-blown (score 42)", () => {
    it("includes mind-blown (weight 40) when points is 42 on victory", () => {
      expect(poolWeight(makeContext({ points: 42 }), "mind-blown")).toBe(40);
    });

    it("includes mind-blown when points is 42 on defeat", () => {
      expect(poolIds(makeContext({ attackWins: false, points: 42 }))).toContain("mind-blown");
    });

    it("mind-blown coexists with victory memes", () => {
      const ids = poolIds(makeContext({ points: 42 }));

      expect(ids).toContain("mind-blown");
      expect(ids).toContain("borat");
    });

    it("mind-blown coexists with defeat memes", () => {
      const ids = poolIds(makeContext({ attackWins: false, points: 42 }));

      expect(ids).toContain("mind-blown");
      expect(ids).toContain("ah-shit");
    });

    it("does NOT include mind-blown when points is not 42", () => {
      expect(poolIds(makeContext({ points: 41 }))).not.toContain("mind-blown");
      expect(poolIds(makeContext({ points: 43 }))).not.toContain("mind-blown");
      expect(poolIds(makeContext({ points: 0 }))).not.toContain("mind-blown");
    });
  });

  describe("special — infinity-beyond (extreme score ±200)", () => {
    it("includes infinity-beyond (weight 30) when takerScore >= 200", () => {
      expect(poolWeight(makeContext({ takerScore: 200 }), "infinity-beyond")).toBe(30);
    });

    it("includes infinity-beyond when takerScore <= -200", () => {
      expect(poolIds(makeContext({ attackWins: false, takerScore: -200 }))).toContain("infinity-beyond");
    });

    it("includes infinity-beyond for very high score (500)", () => {
      expect(poolIds(makeContext({ takerScore: 500 }))).toContain("infinity-beyond");
    });

    it("does NOT include infinity-beyond when |takerScore| < 200", () => {
      expect(poolIds(makeContext({ takerScore: 199 }))).not.toContain("infinity-beyond");
      expect(poolIds(makeContext({ attackWins: false, takerScore: -199 }))).not.toContain("infinity-beyond");
    });

    it("infinity-beyond coexists with victory memes", () => {
      const ids = poolIds(makeContext({ takerScore: 250 }));

      expect(ids).toContain("infinity-beyond");
      expect(ids).toContain("borat");
    });

    it("infinity-beyond coexists with defeat memes", () => {
      const ids = poolIds(makeContext({ attackWins: false, takerScore: -250 }));

      expect(ids).toContain("infinity-beyond");
      expect(ids).toContain("ah-shit");
    });

    it("infinity-beyond coexists with mind-blown when both conditions met", () => {
      const ids = poolIds(makeContext({ points: 42, takerScore: 200 }));

      expect(ids).toContain("infinity-beyond");
      expect(ids).toContain("mind-blown");
    });
  });

  describe("victory — spiderman-pointing (self-call)", () => {
    it("includes spiderman-pointing (weight 40) on self-call win", () => {
      expect(poolWeight(makeContext({ isSelfCall: true }), "spiderman-pointing")).toBe(40);
    });

    it("does NOT include spiderman-pointing on non-self-call win", () => {
      expect(poolIds(makeContext())).not.toContain("spiderman-pointing");
    });

    it("does NOT include spiderman-pointing on self-call loss", () => {
      expect(poolIds(makeContext({ attackWins: false, isSelfCall: true }))).not.toContain("spiderman-pointing");
    });

    it("spiderman-pointing coexists with obama-medal on self-call win", () => {
      const ids = poolIds(makeContext({ isSelfCall: true }));

      expect(ids).toContain("spiderman-pointing");
      expect(ids).toContain("obama-medal");
    });
  });

  describe("victory — jordan-peele (tight margin)", () => {
    it("includes jordan-peele (weight 20) on tight win with 0 margin", () => {
      // 0 oudlers → required 56, points 56 → margin 0
      expect(poolWeight(makeContext({ oudlers: 0, points: 56 }), "jordan-peele")).toBe(20);
    });

    it("includes jordan-peele on tight win with 5 margin", () => {
      // 1 oudler → required 51, points 56 → margin 5
      expect(poolIds(makeContext({ oudlers: 1, points: 56 }))).toContain("jordan-peele");
    });

    it("does NOT include jordan-peele on comfortable win (margin > 5)", () => {
      // 1 oudler → required 51, points 57 → margin 6
      expect(poolIds(makeContext({ oudlers: 1, points: 57 }))).not.toContain("jordan-peele");
    });

    it("does NOT include jordan-peele on defeat", () => {
      expect(poolIds(makeContext({ attackWins: false, oudlers: 0, points: 55 }))).not.toContain("jordan-peele");
    });

    it("jordan-peele coexists with base victory memes", () => {
      const ids = poolIds(makeContext({ oudlers: 0, points: 56 }));

      expect(ids).toContain("jordan-peele");
      expect(ids).toContain("borat");
    });
  });

  describe("victory — chris-pratt-wow (garde-contre win)", () => {
    it("includes chris-pratt-wow (weight 20) on garde-contre victory", () => {
      expect(poolWeight(makeContext({ contract: Contract.GardeContre }), "chris-pratt-wow")).toBe(20);
    });

    it("does NOT include chris-pratt-wow on petite victory", () => {
      expect(poolIds(makeContext())).not.toContain("chris-pratt-wow");
    });

    it("does NOT include chris-pratt-wow on garde-contre loss", () => {
      expect(poolIds(makeContext({ attackWins: false, contract: Contract.GardeContre }))).not.toContain("chris-pratt-wow");
    });

    it("does NOT include chris-pratt-wow on garde sans victory", () => {
      expect(poolIds(makeContext({ contract: Contract.GardeSans }))).not.toContain("chris-pratt-wow");
    });
  });

  describe("defeat — this-is-fine boost (losing streak)", () => {
    it("this-is-fine has weight 1 on basic loss (no streak)", () => {
      expect(poolWeight(makeContext({ attackWins: false }), "this-is-fine")).toBe(1);
    });

    it("this-is-fine has weight 1 on 2 consecutive losses", () => {
      expect(poolWeight(makeContext({ attackWins: false, consecutiveLosses: 2 }), "this-is-fine")).toBe(1);
    });

    it("this-is-fine has boosted weight (20) on 3+ consecutive losses", () => {
      expect(poolWeight(makeContext({ attackWins: false, consecutiveLosses: 3 }), "this-is-fine")).toBe(20);
    });

    it("this-is-fine has boosted weight on 5 consecutive losses", () => {
      expect(poolWeight(makeContext({ attackWins: false, consecutiveLosses: 5 }), "this-is-fine")).toBe(20);
    });

    it("does NOT boost this-is-fine on victory (even with streak)", () => {
      // On victory, this-is-fine is not in the pool at all
      expect(poolIds(makeContext({ consecutiveLosses: 5 }))).not.toContain("this-is-fine");
    });
  });

  describe("defeat — ill-be-back (big loss after big win)", () => {
    it("includes ill-be-back (weight 20) on big loss after big win", () => {
      // Previous score >= 50, current takerScore <= -50
      expect(poolWeight(makeContext({ attackWins: false, previousScore: 50, takerScore: -50 }), "ill-be-back")).toBe(20);
    });

    it("includes ill-be-back on very big swing", () => {
      expect(poolIds(makeContext({ attackWins: false, previousScore: 200, takerScore: -200 }))).toContain("ill-be-back");
    });

    it("does NOT include ill-be-back when previous score < 50", () => {
      expect(poolIds(makeContext({ attackWins: false, previousScore: 49, takerScore: -50 }))).not.toContain("ill-be-back");
    });

    it("does NOT include ill-be-back when current takerScore > -50", () => {
      expect(poolIds(makeContext({ attackWins: false, previousScore: 50, takerScore: -49 }))).not.toContain("ill-be-back");
    });

    it("does NOT include ill-be-back when previousScore is null", () => {
      expect(poolIds(makeContext({ attackWins: false, previousScore: null, takerScore: -100 }))).not.toContain("ill-be-back");
    });

    it("does NOT include ill-be-back on victory", () => {
      expect(poolIds(makeContext({ previousScore: 50, takerScore: 50 }))).not.toContain("ill-be-back");
    });

    it("ill-be-back coexists with this-is-fine boost on losing streak", () => {
      const ids = poolIds(makeContext({
        attackWins: false,
        consecutiveLosses: 3,
        previousScore: 50,
        takerScore: -50,
      }));

      expect(ids).toContain("ill-be-back");
      expect(ids).toContain("this-is-fine");
    });
  });

  describe("doom week memes", () => {
    beforeEach(() => {
      mockIsDoomWeek.mockReturnValue(true);
    });

    afterEach(() => {
      mockIsDoomWeek.mockReturnValue(false);
    });

    it("includes doom-bleeding (weight 3) on defeat during doom week", () => {
      const ctx = makeContext({ attackWins: false });

      expect(poolIds(ctx)).toContain("doom-bleeding");
      expect(poolWeight(ctx, "doom-bleeding")).toBe(3);
    });

    it("does NOT include doom-bleeding on victory during doom week", () => {
      expect(poolIds(makeContext())).not.toContain("doom-bleeding");
    });

    it("does NOT include doom-bleeding outside doom week", () => {
      mockIsDoomWeek.mockReturnValue(false);

      expect(poolIds(makeContext({ attackWins: false }))).not.toContain("doom-bleeding");
    });

    it("includes rip-and-tear (weight 3) on victory during doom week", () => {
      const ctx = makeContext();

      expect(poolIds(ctx)).toContain("rip-and-tear");
      expect(poolWeight(ctx, "rip-and-tear")).toBe(3);
    });

    it("does NOT include rip-and-tear on defeat during doom week", () => {
      expect(poolIds(makeContext({ attackWins: false }))).not.toContain("rip-and-tear");
    });

    it("does NOT include rip-and-tear outside doom week", () => {
      mockIsDoomWeek.mockReturnValue(false);

      expect(poolIds(makeContext())).not.toContain("rip-and-tear");
    });

    it("includes doom-demon (weight 15) on improbable defeat during doom week", () => {
      const ctx = makeContext({ attackWins: false, oudlers: 3 });

      expect(poolIds(ctx)).toContain("doom-demon");
      expect(poolWeight(ctx, "doom-demon")).toBe(15);
    });

    it("includes doom-demon on chelem raté during doom week", () => {
      expect(poolIds(makeContext({ attackWins: false, chelem: Chelem.AnnouncedLost }))).toContain("doom-demon");
    });

    it("includes doom-demon on garde contre loss during doom week", () => {
      expect(poolIds(makeContext({ attackWins: false, contract: Contract.GardeContre }))).toContain("doom-demon");
    });

    it("does NOT include doom-demon on basic defeat during doom week", () => {
      expect(poolIds(makeContext({ attackWins: false }))).not.toContain("doom-demon");
    });

    it("does NOT include doom-demon outside doom week", () => {
      mockIsDoomWeek.mockReturnValue(false);

      expect(poolIds(makeContext({ attackWins: false, oudlers: 3 }))).not.toContain("doom-demon");
    });

    it("doom memes coexist with regular memes", () => {
      const ids = poolIds(makeContext({ attackWins: false, oudlers: 3 }));

      expect(ids).toContain("doom-bleeding");
      expect(ids).toContain("doom-demon");
      expect(ids).toContain("ah-shit");
      expect(ids).toContain("chosen-one");
    });
  });
});

// --- selectMeme ---

describe("selectMeme", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null when gate fails (Math.random >= 0.4)", () => {
    vi.spyOn(Math, "random").mockReturnValueOnce(0.5);

    expect(selectMeme(makeContext())).toBeNull();
  });

  it("returns a meme when gate passes", () => {
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0.1)  // gate
      .mockReturnValueOnce(0);   // weighted pick

    expect(selectMeme(makeContext())).not.toBeNull();
  });

  it("all returned memes have valid id and image", () => {
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0.1)
      .mockReturnValueOnce(0);

    const result = selectMeme(makeContext());

    expect(result!.id).toBeTruthy();
    expect(result!.image).toMatch(/^\/memes\/.+\.(webp|gif|jpg)$/);
  });

  it("weighted selection favors high-weight memes", () => {
    // Score 42 + victory: pool = [mind-blown(40), borat(1), ..., pacha(1)]
    // Total weight = 45. mind-blown occupies [0, 40/45) of the range.
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0.1)     // gate
      .mockReturnValueOnce(0.5);    // weighted pick: 0.5 * 45 = 22.5 → still in mind-blown range

    const result = selectMeme(makeContext({ points: 42 }));

    expect(result!.id).toBe("mind-blown");
    expect(result!.caption).toBe("42 — La réponse à la grande question");
  });

  it("low-weight memes can still be selected", () => {
    // Score 42 + victory: total = 45, borat is at [40, 41)
    // Math.random = 40/45 ≈ 0.8889 → roll = 40.0 → after mind-blown(40): 0.0, not < 0 → borat(-1): -1 < 0 → borat
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0.1)         // gate
      .mockReturnValueOnce(40 / 45);    // weighted pick → borat

    const result = selectMeme(makeContext({ points: 42 }));

    expect(result!.id).toBe("borat");
  });

  it("returns null on score 42 when gate fails", () => {
    vi.spyOn(Math, "random").mockReturnValueOnce(0.5);

    expect(selectMeme(makeContext({ points: 42 }))).toBeNull();
  });
});
