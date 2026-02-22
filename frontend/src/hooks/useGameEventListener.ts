import { useEffect } from "react";
import { gameEvents } from "../services/gameEvents";
import type { GameCompletedEvent } from "../services/gameEvents";

type GameEventMap = {
  "game:completed": GameCompletedEvent;
};

export function useGameEventListener<K extends keyof GameEventMap>(
  event: K,
  handler: (payload: GameEventMap[K]) => void,
): void {
  useEffect(() => {
    gameEvents.on(event, handler);
    return () => {
      gameEvents.off(event, handler);
    };
  }, [event, handler]);
}
