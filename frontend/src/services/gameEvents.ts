import mitt from "mitt";
import type { GameContext } from "./memeSelector";
import type { CumulativeScore } from "../types/api";

export interface GameCompletedEvent {
  context: GameContext;
  cumulativeScores: CumulativeScore[];
  previousCumulativeScores: CumulativeScore[];
}

type GameEvents = {
  "game:completed": GameCompletedEvent;
};

export const gameEvents = mitt<GameEvents>();
