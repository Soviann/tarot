import { afterEach, describe, expect, it, vi } from "vitest";
import { gameEvents, type GameCompletedEvent } from "../../services/gameEvents";
import { Chelem, Contract, Side } from "../../types/enums";

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

describe("gameEvents", () => {
  afterEach(() => {
    // Remove all listeners between tests
    gameEvents.all.clear();
  });

  it("delivers event to subscriber", () => {
    const handler = vi.fn();
    gameEvents.on("game:completed", handler);

    const event = makeEvent();
    gameEvents.emit("game:completed", event);

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(event);
  });

  it("stops delivering after unsubscribe", () => {
    const handler = vi.fn();
    gameEvents.on("game:completed", handler);
    gameEvents.off("game:completed", handler);

    gameEvents.emit("game:completed", makeEvent());

    expect(handler).not.toHaveBeenCalled();
  });

  it("supports multiple listeners on the same event", () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();
    gameEvents.on("game:completed", handler1);
    gameEvents.on("game:completed", handler2);

    gameEvents.emit("game:completed", makeEvent());

    expect(handler1).toHaveBeenCalledOnce();
    expect(handler2).toHaveBeenCalledOnce();
  });
});
