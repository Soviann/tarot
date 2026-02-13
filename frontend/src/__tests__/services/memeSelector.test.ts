import { selectDefeatMeme, selectVictoryMeme } from "../../services/memeSelector";
import { Chelem, Contract, Side } from "../../types/enums";
import type { GameContext } from "../../services/memeSelector";

function makeContext(overrides: Partial<GameContext> = {}): GameContext {
  return {
    attackWins: true,
    chelem: Chelem.None,
    contract: Contract.Petite,
    oudlers: 0,
    petitAuBout: Side.None,
    ...overrides,
  };
}

// Math.random() call order (when no petit au bout):
// 1st: overall meme gate (< 0.4 → proceed, >= 0.4 → null)
// 2nd: Vince chance (< 0.4 → Vince, >= 0.4 → basic pool)
// 3rd: basic pool index (if needed)

describe("selectVictoryMeme", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null when attack loses", () => {
    const result = selectVictoryMeme(makeContext({ attackWins: false }));

    expect(result).toBeNull();
  });

  it("returns null when random >= 0.4 (no meme shown)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    const result = selectVictoryMeme(makeContext());

    expect(result).toBeNull();
  });

  it("returns success-kid when petit au bout is attack (ignores overall chance)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);

    const result = selectVictoryMeme(makeContext({ petitAuBout: Side.Attack }));

    expect(result).not.toBeNull();
    expect(result!.id).toBe("success-kid");
    expect(result!.image).toBe("/memes/success-kid.webp");
    expect(result!.caption).toBeTruthy();
  });

  it("returns vince-1 for Petite when both randoms < 0.4", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);

    const result = selectVictoryMeme(makeContext({ contract: Contract.Petite }));

    expect(result!.id).toBe("vince-1");
  });

  it("returns vince-2 for Garde when both randoms < 0.4", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.2);

    const result = selectVictoryMeme(makeContext({ contract: Contract.Garde }));

    expect(result!.id).toBe("vince-2");
  });

  it("returns vince-3 for Garde Sans when both randoms < 0.4", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);

    const result = selectVictoryMeme(makeContext({ contract: Contract.GardeSans }));

    expect(result!.id).toBe("vince-3");
  });

  it("returns vince-4 for Garde Contre when both randoms < 0.4", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.39);

    const result = selectVictoryMeme(makeContext({ contract: Contract.GardeContre }));

    expect(result!.id).toBe("vince-4");
  });

  it("returns a basic pool meme when gate passes but Vince chance fails", () => {
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0.1)   // 1st call: pass gate (< 0.4)
      .mockReturnValueOnce(0.5)   // 2nd call: skip Vince (>= 0.4)
      .mockReturnValueOnce(0);    // 3rd call: pick from pool (index 0)

    const result = selectVictoryMeme(makeContext());

    expect(result).not.toBeNull();
    expect(["deal-with-it", "champions", "dicaprio-toast", "over-9000"]).toContain(result!.id);
  });

  it("all returned memes have valid id, image, and caption", () => {
    const contracts = [Contract.Petite, Contract.Garde, Contract.GardeSans, Contract.GardeContre];

    // Test petit au bout (always shown)
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const petitResult = selectVictoryMeme(makeContext({ petitAuBout: Side.Attack }));
    expect(petitResult!.id).toBeTruthy();
    expect(petitResult!.image).toMatch(/^\/memes\/.+\.webp$/);
    expect(petitResult!.caption).toBeTruthy();

    // Test Vince variants (gate + Vince both pass)
    for (const contract of contracts) {
      vi.spyOn(Math, "random").mockReturnValue(0.1);
      const vinceResult = selectVictoryMeme(makeContext({ contract }));
      expect(vinceResult!.id).toBeTruthy();
      expect(vinceResult!.image).toMatch(/^\/memes\/.+\.webp$/);
      expect(vinceResult!.caption).toBeTruthy();
    }

    // Test basic pool (gate passes, Vince fails)
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0.1)   // gate
      .mockReturnValueOnce(0.5)   // skip Vince
      .mockReturnValueOnce(0);    // pool index
    const poolResult = selectVictoryMeme(makeContext());
    expect(poolResult!.id).toBeTruthy();
    expect(poolResult!.image).toMatch(/^\/memes\/.+\.webp$/);
    expect(poolResult!.caption).toBeTruthy();
  });

  it("petit au bout defense does NOT trigger success-kid", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);

    const result = selectVictoryMeme(makeContext({ petitAuBout: Side.Defense }));

    expect(result!.id).not.toBe("success-kid");
  });
});

// Math.random() call order for defeat (when no pikachu trigger):
// 1st: overall meme gate (< 0.4 → proceed, >= 0.4 → null)
// 2nd: reverse Vince chance (< 0.4 → reverse Vince, >= 0.4 → basic pool)
// 3rd: basic pool index (if needed)

describe("selectDefeatMeme", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null when attack wins", () => {
    const result = selectDefeatMeme(makeContext({ attackWins: true }));

    expect(result).toBeNull();
  });

  it("returns null when random >= 0.4 (no meme shown)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    const result = selectDefeatMeme(makeContext({ attackWins: false }));

    expect(result).toBeNull();
  });

  // --- Pikachu surprised: guaranteed on improbable defeats ---

  it("returns pikachu-surprised when losing with 3 bouts (ignores chance)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);

    const result = selectDefeatMeme(makeContext({ attackWins: false, oudlers: 3 }));

    expect(result).not.toBeNull();
    expect(result!.id).toBe("pikachu-surprised");
    expect(result!.image).toBe("/memes/pikachu-surprised.webp");
    expect(result!.caption).toBeTruthy();
  });

  it("returns pikachu-surprised when chelem raté (ignores chance)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);

    const result = selectDefeatMeme(makeContext({ attackWins: false, chelem: Chelem.AnnouncedLost }));

    expect(result).not.toBeNull();
    expect(result!.id).toBe("pikachu-surprised");
  });

  it("returns pikachu-surprised when garde contre perdue (ignores chance)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);

    const result = selectDefeatMeme(makeContext({ attackWins: false, contract: Contract.GardeContre }));

    expect(result).not.toBeNull();
    expect(result!.id).toBe("pikachu-surprised");
  });

  // --- Reverse Vince McMahon: contract-specific disappointment ---

  it("returns vince-reverse-1 for Petite when both randoms < 0.4", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);

    const result = selectDefeatMeme(makeContext({ attackWins: false, contract: Contract.Petite }));

    expect(result!.id).toBe("vince-reverse-1");
  });

  it("returns vince-reverse-2 for Garde when both randoms < 0.4", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.2);

    const result = selectDefeatMeme(makeContext({ attackWins: false, contract: Contract.Garde }));

    expect(result!.id).toBe("vince-reverse-2");
  });

  it("returns vince-reverse-3 for Garde Sans when both randoms < 0.4", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);

    const result = selectDefeatMeme(makeContext({ attackWins: false, contract: Contract.GardeSans }));

    expect(result!.id).toBe("vince-reverse-3");
  });

  // Note: GardeContre is handled by pikachu (guaranteed), so no vince-reverse-4 test

  // --- Basic defeat pool ---

  it("returns a basic defeat pool meme when gate passes but Vince chance fails", () => {
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0.1)   // 1st call: pass gate (< 0.4)
      .mockReturnValueOnce(0.5)   // 2nd call: skip Vince (>= 0.4)
      .mockReturnValueOnce(0);    // 3rd call: pick from pool (index 0)

    const result = selectDefeatMeme(makeContext({ attackWins: false }));

    expect(result).not.toBeNull();
    expect(["sad-pablo", "crying-jordan", "first-time", "ah-shit", "just-to-suffer"]).toContain(result!.id);
  });

  // --- Validation ---

  it("all returned memes have valid id, image, and caption", () => {
    const contracts = [Contract.Petite, Contract.Garde, Contract.GardeSans];

    // Test pikachu (always shown for 3 bouts)
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const pikachuResult = selectDefeatMeme(makeContext({ attackWins: false, oudlers: 3 }));
    expect(pikachuResult!.id).toBeTruthy();
    expect(pikachuResult!.image).toMatch(/^\/memes\/.+\.webp$/);
    expect(pikachuResult!.caption).toBeTruthy();

    // Test reverse Vince variants (gate + Vince both pass)
    for (const contract of contracts) {
      vi.spyOn(Math, "random").mockReturnValue(0.1);
      const vinceResult = selectDefeatMeme(makeContext({ attackWins: false, contract }));
      expect(vinceResult!.id).toBeTruthy();
      expect(vinceResult!.image).toMatch(/^\/memes\/.+\.webp$/);
      expect(vinceResult!.caption).toBeTruthy();
    }

    // Test basic pool (gate passes, Vince fails)
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0.1)   // gate
      .mockReturnValueOnce(0.5)   // skip Vince
      .mockReturnValueOnce(0);    // pool index
    const poolResult = selectDefeatMeme(makeContext({ attackWins: false }));
    expect(poolResult!.id).toBeTruthy();
    expect(poolResult!.image).toMatch(/^\/memes\/.+\.webp$/);
    expect(poolResult!.caption).toBeTruthy();
  });

  it("2 bouts does NOT trigger pikachu", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);

    const result = selectDefeatMeme(makeContext({ attackWins: false, oudlers: 2 }));

    expect(result!.id).not.toBe("pikachu-surprised");
  });

  it("chelem none does NOT trigger pikachu", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);

    const result = selectDefeatMeme(makeContext({ attackWins: false, chelem: Chelem.None }));

    expect(result!.id).not.toBe("pikachu-surprised");
  });

  it("chelem announced won does NOT trigger pikachu", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);

    const result = selectDefeatMeme(makeContext({ attackWins: false, chelem: Chelem.AnnouncedWon }));

    expect(result!.id).not.toBe("pikachu-surprised");
  });

  it("chelem not announced won does NOT trigger pikachu", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);

    const result = selectDefeatMeme(makeContext({ attackWins: false, chelem: Chelem.NotAnnouncedWon }));

    expect(result!.id).not.toBe("pikachu-surprised");
  });
});
