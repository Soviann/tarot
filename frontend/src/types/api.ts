import type { Chelem, Contract, GameStatus, Poignee, Side } from "./enums";

export interface CumulativeScore {
  playerId: number;
  playerName: string;
  score: number;
}

export interface Game {
  chelem: Chelem;
  contract: Contract;
  createdAt: string;
  id: number;
  oudlers: number | null;
  partner: GamePlayer | null;
  petitAuBout: Side;
  poignee: Poignee;
  poigneeOwner: Side;
  points: number | null;
  position: number;
  scoreEntries: ScoreEntry[];
  status: GameStatus;
  taker: GamePlayer;
}

export interface GamePlayer {
  id: number;
  name: string;
}

export interface HydraCollection<T> {
  member: T[];
  totalItems: number;
}

export interface Player {
  createdAt: string;
  id: number;
  name: string;
}

export interface ScoreEntry {
  id: number;
  player: GamePlayer;
  score: number;
}

export interface Session {
  createdAt: string;
  id: number;
  isActive: boolean;
  players: SessionPlayer[];
}

export interface SessionDetail {
  createdAt: string;
  cumulativeScores: CumulativeScore[];
  games: Game[];
  id: number;
  isActive: boolean;
  players: GamePlayer[];
}

export interface SessionPlayer {
  name: string;
}
