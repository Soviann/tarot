import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDoomSounds } from "../../hooks/useDoomSounds";
import { gameEvents, type GameCompletedEvent } from "../../services/gameEvents";
import { Chelem, Contract, Side } from "../../types/enums";

// Mock next-themes
let mockResolvedTheme = "doom";
vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: mockResolvedTheme }),
}));

// Mock Audio
const mockPlay = vi.fn().mockResolvedValue(undefined);
const mockAudioInstances: { src: string }[] = [];

beforeEach(() => {
  vi.useFakeTimers();
  mockAudioInstances.length = 0;
  vi.stubGlobal(
    "Audio",
    class MockAudio {
      src: string;
      play = mockPlay;
      constructor(src: string) {
        this.src = src;
        mockAudioInstances.push(this);
      }
    },
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  gameEvents.all.clear();
  mockResolvedTheme = "doom";
});

function makeEvent(overrides?: Partial<GameCompletedEvent>): GameCompletedEvent {
  return {
    context: {
      attackWins: true,
      chelem: Chelem.None,
      consecutiveLosses: 0,
      contract: Contract.Petite,
      isSelfCall: false,
      oudlers: 2,
      petitAuBout: Side.None,
      points: 45,
      previousScore: null,
      takerScore: 30,
    },
    cumulativeScores: [],
    previousCumulativeScores: [],
    ...overrides,
  };
}

describe("useDoomSounds", () => {
  it("plays nothing when theme is not doom", () => {
    mockResolvedTheme = "light";
    renderHook(() => useDoomSounds());

    gameEvents.emit("game:completed", makeEvent());

    expect(mockPlay).not.toHaveBeenCalled();
  });

  it("plays pistol on basic victory", () => {
    renderHook(() => useDoomSounds());

    gameEvents.emit("game:completed", makeEvent({ context: { ...makeEvent().context, attackWins: true, takerScore: 30 } }));

    expect(mockAudioInstances).toHaveLength(1);
    expect(mockAudioInstances[0].src).toBe("/sounds/doom/pistol.wav");
  });

  it("plays shotgun on big victory (>= 200)", () => {
    renderHook(() => useDoomSounds());

    gameEvents.emit("game:completed", makeEvent({ context: { ...makeEvent().context, attackWins: true, takerScore: 200 } }));

    expect(mockAudioInstances).toHaveLength(1);
    expect(mockAudioInstances[0].src).toBe("/sounds/doom/shotgun.wav");
  });

  it("plays chainsaw on self-call victory", () => {
    renderHook(() => useDoomSounds());

    gameEvents.emit("game:completed", makeEvent({ context: { ...makeEvent().context, attackWins: true, isSelfCall: true } }));

    expect(mockAudioInstances).toHaveLength(1);
    expect(mockAudioInstances[0].src).toBe("/sounds/doom/chainsaw-up.wav");
  });

  it("plays player-umf on basic defeat", () => {
    renderHook(() => useDoomSounds());

    gameEvents.emit("game:completed", makeEvent({ context: { ...makeEvent().context, attackWins: false, takerScore: -30 } }));

    expect(mockAudioInstances).toHaveLength(1);
    expect(mockAudioInstances[0].src).toBe("/sounds/doom/player-umf.wav");
  });

  it("plays player-pain on big defeat (<= -200)", () => {
    renderHook(() => useDoomSounds());

    gameEvents.emit("game:completed", makeEvent({ context: { ...makeEvent().context, attackWins: false, takerScore: -200 } }));

    expect(mockAudioInstances).toHaveLength(1);
    expect(mockAudioInstances[0].src).toBe("/sounds/doom/player-pain.wav");
  });

  it("plays klaxon 3x when a player crosses ±1000", () => {
    renderHook(() => useDoomSounds());

    gameEvents.emit("game:completed", makeEvent({
      context: { ...makeEvent().context, attackWins: true, takerScore: 50 },
      cumulativeScores: [{ playerId: 1, playerName: "Alice", score: 1010 }],
      previousCumulativeScores: [{ playerId: 1, playerName: "Alice", score: 990 }],
    }));

    // First klaxon plays immediately
    expect(mockAudioInstances).toHaveLength(1);
    expect(mockAudioInstances[0].src).toBe("/sounds/doom/klaxon.wav");

    // Second klaxon after 300ms
    vi.advanceTimersByTime(300);
    expect(mockAudioInstances).toHaveLength(2);

    // Third klaxon after another 300ms
    vi.advanceTimersByTime(300);
    expect(mockAudioInstances).toHaveLength(3);
  });

  it("plays klaxon when a player crosses -1000", () => {
    renderHook(() => useDoomSounds());

    gameEvents.emit("game:completed", makeEvent({
      context: { ...makeEvent().context, attackWins: false, takerScore: -50 },
      cumulativeScores: [{ playerId: 1, playerName: "Alice", score: -1010 }],
      previousCumulativeScores: [{ playerId: 1, playerName: "Alice", score: -990 }],
    }));

    expect(mockAudioInstances[0].src).toBe("/sounds/doom/klaxon.wav");
  });

  it("exposes playActivation that plays door-open sound", () => {
    const { result } = renderHook(() => useDoomSounds());

    result.current.playActivation();

    expect(mockAudioInstances).toHaveLength(1);
    expect(mockAudioInstances[0].src).toBe("/sounds/doom/door-open.wav");
  });
});
