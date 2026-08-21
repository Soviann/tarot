import { describe, expect, it } from "vitest";
import { CUSTOM_THEME_NAMES, CUSTOM_THEMES, getThemeConfig } from "../../services/themeRegistry";

describe("themeRegistry", () => {
  it("returns doom config for 'doom' theme", () => {
    const config = getThemeConfig("doom");

    expect(config).toBeDefined();
    expect(config?.name).toBe("doom");
    expect(config?.triggerNames).toEqual(["doomguy", "doom guy"]);
    expect(config?.starIcons.length).toBeGreaterThan(0);
    expect(config?.avatars.icons.length).toBeGreaterThan(0);
  });

  it("returns undefined for standard themes", () => {
    expect(getThemeConfig("light")).toBeUndefined();
    expect(getThemeConfig("dark")).toBeUndefined();
    expect(getThemeConfig("system")).toBeUndefined();
  });

  it("returns undefined when called with no argument", () => {
    expect(getThemeConfig()).toBeUndefined();
    expect(getThemeConfig(undefined)).toBeUndefined();
  });

  it("CUSTOM_THEME_NAMES matches CUSTOM_THEMES keys", () => {
    expect(CUSTOM_THEME_NAMES).toEqual(Object.keys(CUSTOM_THEMES));
  });

  it("doom selectSound returns a sound for a basic victory", () => {
    const config = getThemeConfig("doom");
    const sound = config?.selectSound({
      context: {
        attackWins: true,
        chelem: "none",
        consecutiveLosses: 0,
        contract: "petite",
        isSelfCall: false,
        oudlers: 2,
        petitAuBout: "none",
        points: 45,
        previousScore: null,
        takerScore: 30,
      },
      cumulativeScores: [],
      previousCumulativeScores: [],
    });

    expect(sound).toEqual({ src: "/sounds/doom/pistol.wav" });
  });

  it("returns noel config for 'noel' theme", () => {
    const config = getThemeConfig("noel");

    expect(config).toBeDefined();
    expect(config?.name).toBe("noel");
    expect(config?.triggerNames).toEqual(["noel", "pere noel", "santa"]);
    expect(config?.logo).toBe("/images/noel/santa-hat.png");
    expect(config?.dealerIcon).toBe("/images/noel/santa-hat.png");
  });

  it("noel selectSound returns victory sound on attack win and null otherwise", () => {
    const config = getThemeConfig("noel");
    const winSound = config?.selectSound({
      context: {
        attackWins: true,
        chelem: "none",
        consecutiveLosses: 0,
        contract: "garde",
        isSelfCall: false,
        oudlers: 2,
        petitAuBout: "none",
        points: 50,
        previousScore: null,
        takerScore: 40,
      },
      cumulativeScores: [],
      previousCumulativeScores: [],
    });
    expect(winSound).toEqual({ src: "/sounds/noel/christmas-victory.mp3" });

    const lossSound = config?.selectSound({
      context: {
        attackWins: false,
        chelem: "none",
        consecutiveLosses: 0,
        contract: "garde",
        isSelfCall: false,
        oudlers: 2,
        petitAuBout: "none",
        points: 30,
        previousScore: null,
        takerScore: -40,
      },
      cumulativeScores: [],
      previousCumulativeScores: [],
    });
    expect(lossSound).toBeNull();
  });
});
