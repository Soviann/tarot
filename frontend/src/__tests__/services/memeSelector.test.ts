import { buildPool, selectMeme } from "../../services/memeSelector";
import type { GameContext } from "../../services/memeSelector";
import { Chelem, Contract, Side } from "../../types/enums";

function makeContext(overrides: Partial<GameContext> = {}): GameContext {
  return {
    attackWins: true,
    chelem: Chelem.None,
    contract: Contract.Petite,
    isSelfCall: false,
    oudlers: 0,
    petitAuBout: Side.None,
    points: 51,
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
