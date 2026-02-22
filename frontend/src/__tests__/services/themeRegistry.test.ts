import { describe, expect, it } from "vitest";
import { CUSTOM_THEME_NAMES, CUSTOM_THEMES, getThemeConfig } from "../../services/themeRegistry";

describe("themeRegistry", () => {
  it("returns doom config for 'doom' theme", () => {
    const config = getThemeConfig("doom");

    expect(config).toBeDefined();
    expect(config?.name).toBe("doom");
    expect(config?.cheatCode).toBe("iddqd");
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

    expect(sound).toBe("/sounds/doom/pistol.wav");
  });
});
