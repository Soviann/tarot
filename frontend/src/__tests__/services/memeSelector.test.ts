import { selectDefeatMeme, selectVictoryMeme } from "../../services/memeSelector";
import { Chelem, Contract, Side } from "../../types/enums";
import type { GameContext } from "../../services/memeSelector";

function makeContext(overrides: Partial<GameContext> = {}): GameContext {
  return {
    attackWins: true,
    chelem: Chelem.None,
    contract: Contract.Petite,
    isSelfCall: false,
    oudlers: 0,
    petitAuBout: Side.None,
    ...overrides,
  };
}

// Math.random() call order (when no petit au bout):
// 1st: overall meme gate (< 0.4 → proceed, >= 0.4 → null)
// 2nd: basic pool index

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
  });

  it("returns obama-medal when self-call win (ignores overall chance)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);

    const result = selectVictoryMeme(makeContext({ isSelfCall: true }));

    expect(result).not.toBeNull();
    expect(result!.id).toBe("obama-medal");
    expect(result!.image).toBe("/memes/obama-medal.webp");
  });

  it("petit au bout takes priority over self-call", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);

    const result = selectVictoryMeme(makeContext({ isSelfCall: true, petitAuBout: Side.Attack }));

    expect(result!.id).toBe("success-kid");
  });

  it("returns a basic pool meme when gate passes", () => {
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0.1)   // 1st call: pass gate (< 0.4)
      .mockReturnValueOnce(0);    // 2nd call: pick from pool (index 0)

    const result = selectVictoryMeme(makeContext());

    expect(result).not.toBeNull();
    expect(["borat", "champions", "dicaprio-toast", "over-9000", "pacha"]).toContain(result!.id);
  });

  it("all returned memes have valid id and image", () => {
    // Test petit au bout (always shown)
    vi.spyOn(Math, "random").mockReturnValue(0.99);
    const petitResult = selectVictoryMeme(makeContext({ petitAuBout: Side.Attack }));
    expect(petitResult!.id).toBeTruthy();
    expect(petitResult!.image).toMatch(/^\/memes\/.+\.webp$/);

    // Test obama-medal (always shown on self-call)
    const obamaResult = selectVictoryMeme(makeContext({ isSelfCall: true }));
    expect(obamaResult!.id).toBeTruthy();
    expect(obamaResult!.image).toMatch(/^\/memes\/.+\.webp$/);

    // Test basic pool
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0.1)   // gate
      .mockReturnValueOnce(0);    // pool index
    const poolResult = selectVictoryMeme(makeContext());
    expect(poolResult!.id).toBeTruthy();
    expect(poolResult!.image).toMatch(/^\/memes\/.+\.webp$/);
  });

  it("petit au bout defense does NOT trigger success-kid", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);

    const result = selectVictoryMeme(makeContext({ petitAuBout: Side.Defense }));

    expect(result!.id).not.toBe("success-kid");
  });
});

// Defeat meme priority order:
// 1. Improbable defeat (3 bouts, chelem raté, garde contre) → guaranteed Pikachu/Picard
// 2. Garde sans perdue → guaranteed Crying Jordan
// 3. 40% gate → 40% This is Fine / 60% random pool

const IMPROBABLE_DEFEAT_IDS = ["chosen-one", "picard-facepalm", "pikachu-surprised"];

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

  // --- Priority 1: Improbable defeats ---

  it("returns an improbable defeat meme when losing with 3 bouts (ignores chance)", () => {
    vi.spyOn(Math, "random").mockReturnValueOnce(0);

    const result = selectDefeatMeme(makeContext({ attackWins: false, oudlers: 3 }));

    expect(result).not.toBeNull();
    expect(IMPROBABLE_DEFEAT_IDS).toContain(result!.id);
    expect(result!.image).toMatch(/^\/memes\/.+\.webp$/);
  });

  it("returns an improbable defeat meme when chelem raté (ignores chance)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);

    const result = selectDefeatMeme(makeContext({ attackWins: false, chelem: Chelem.AnnouncedLost }));

    expect(result).not.toBeNull();
    expect(IMPROBABLE_DEFEAT_IDS).toContain(result!.id);
  });

  it("returns an improbable defeat meme when garde contre perdue (ignores chance)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);

    const result = selectDefeatMeme(makeContext({ attackWins: false, contract: Contract.GardeContre }));

    expect(result).not.toBeNull();
    expect(IMPROBABLE_DEFEAT_IDS).toContain(result!.id);
  });

  it("can return chosen-one on improbable defeat", () => {
    vi.spyOn(Math, "random").mockReturnValueOnce(0);

    const result = selectDefeatMeme(makeContext({ attackWins: false, oudlers: 3 }));

    expect(result!.id).toBe("chosen-one");
  });

  it("can return picard-facepalm on improbable defeat", () => {
    vi.spyOn(Math, "random").mockReturnValueOnce(0.34);

    const result = selectDefeatMeme(makeContext({ attackWins: false, oudlers: 3 }));

    expect(result!.id).toBe("picard-facepalm");
  });

  it("can return pikachu-surprised on improbable defeat", () => {
    vi.spyOn(Math, "random").mockReturnValueOnce(0.67);

    const result = selectDefeatMeme(makeContext({ attackWins: false, oudlers: 3 }));

    expect(result!.id).toBe("pikachu-surprised");
  });

  // --- Priority 2: Crying Jordan on garde sans perdue ---

  it("returns crying-jordan when garde sans is lost (guaranteed)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.99);

    const result = selectDefeatMeme(makeContext({ attackWins: false, contract: Contract.GardeSans }));

    expect(result!.id).toBe("crying-jordan");
  });

  // --- Priority order: improbable > crying jordan ---

  it("improbable defeat takes priority over garde sans (crying jordan)", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);

    // Garde sans with 3 bouts → improbable wins
    const result = selectDefeatMeme(makeContext({
      attackWins: false,
      contract: Contract.GardeSans,
      oudlers: 3,
    }));

    expect(IMPROBABLE_DEFEAT_IDS).toContain(result!.id);
  });

  // --- This is Fine ---

  it("returns this-is-fine when both randoms < 0.4", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);

    const result = selectDefeatMeme(makeContext({ attackWins: false }));

    expect(result!.id).toBe("this-is-fine");
  });

  // --- Basic defeat pool ---

  it("returns a basic defeat pool meme when gate passes but This is Fine chance fails", () => {
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0.1)   // 1st call: pass gate (< 0.4)
      .mockReturnValueOnce(0.5)   // 2nd call: skip This is Fine (>= 0.4)
      .mockReturnValueOnce(0);    // 3rd call: pick from pool (index 0)

    const result = selectDefeatMeme(makeContext({ attackWins: false }));

    expect(result).not.toBeNull();
    expect(["ah-shit", "just-to-suffer", "sad-pablo"]).toContain(result!.id);
  });

  // --- Validation ---

  it("all returned memes have valid id and image", () => {
    // Test improbable defeat
    vi.spyOn(Math, "random").mockReturnValue(0);
    const improbableResult = selectDefeatMeme(makeContext({ attackWins: false, oudlers: 3 }));
    expect(improbableResult!.id).toBeTruthy();
    expect(improbableResult!.image).toMatch(/^\/memes\/.+\.webp$/);

    // Test Crying Jordan
    const cryingResult = selectDefeatMeme(makeContext({ attackWins: false, contract: Contract.GardeSans }));
    expect(cryingResult!.id).toBe("crying-jordan");
    expect(cryingResult!.image).toMatch(/^\/memes\/.+\.webp$/);

    // Test This is Fine (gate + chance both pass)
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    const thisIsFineResult = selectDefeatMeme(makeContext({ attackWins: false }));
    expect(thisIsFineResult!.id).toBe("this-is-fine");
    expect(thisIsFineResult!.image).toMatch(/^\/memes\/.+\.webp$/);

    // Test basic pool (gate passes, This is Fine fails)
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0.1)   // gate
      .mockReturnValueOnce(0.5)   // skip This is Fine
      .mockReturnValueOnce(0);    // pool index
    const poolResult = selectDefeatMeme(makeContext({ attackWins: false }));
    expect(poolResult!.id).toBeTruthy();
    expect(poolResult!.image).toMatch(/^\/memes\/.+\.webp$/);
  });

  // --- Negative tests ---

  it("2 bouts does NOT trigger improbable defeat meme", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);

    const result = selectDefeatMeme(makeContext({ attackWins: false, oudlers: 2 }));

    expect(IMPROBABLE_DEFEAT_IDS).not.toContain(result!.id);
  });

  it("chelem none does NOT trigger improbable defeat meme", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);

    const result = selectDefeatMeme(makeContext({ attackWins: false, chelem: Chelem.None }));

    expect(IMPROBABLE_DEFEAT_IDS).not.toContain(result!.id);
  });

  it("chelem announced won does NOT trigger improbable defeat meme", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);

    const result = selectDefeatMeme(makeContext({ attackWins: false, chelem: Chelem.AnnouncedWon }));

    expect(IMPROBABLE_DEFEAT_IDS).not.toContain(result!.id);
  });

  it("chelem not announced won does NOT trigger improbable defeat meme", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);

    const result = selectDefeatMeme(makeContext({ attackWins: false, chelem: Chelem.NotAnnouncedWon }));

    expect(IMPROBABLE_DEFEAT_IDS).not.toContain(result!.id);
  });
});
