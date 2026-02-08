import type { Chelem, Contract, GameStatus, Poignee, Side } from "./enums";

export interface EloHistoryEntry {
  date: string;
  gameId: number;
  ratingAfter: number;
  ratingChange: number;
}

export interface EloRankingEntry {
  eloRating: number;
  gamesPlayed: number;
  playerId: number;
  playerName: string;
}

export interface ContractDistributionEntry {
  contract: Contract;
  count: number;
  percentage: number;
}

export interface CumulativeScore {
  playerId: number;
  playerName: string;
  score: number;
}

export interface Game {
  chelem: Chelem;
  contract: Contract;
  createdAt: string;
  dealer: GamePlayer | null;
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

export interface GlobalStatistics {
  contractDistribution: ContractDistributionEntry[];
  eloRanking: EloRankingEntry[];
  leaderboard: LeaderboardEntry[];
  totalGames: number;
  totalSessions: number;
  totalStars: number;
}

export interface HydraCollection<T> {
  member: T[];
  totalItems: number;
}

export interface LeaderboardEntry {
  gamesAsTaker: number;
  gamesPlayed: number;
  playerId: number;
  playerName: string;
  totalScore: number;
  winRate: number;
  wins: number;
}

export interface Player {
  active: boolean;
  createdAt: string;
  id: number;
  name: string;
}

export interface PlayerContractEntry {
  contract: Contract;
  count: number;
  winRate: number;
  wins: number;
}

export interface PlayerStatistics {
  averageScore: number;
  bestGameScore: number;
  contractDistribution: PlayerContractEntry[];
  eloHistory: EloHistoryEntry[];
  eloRating: number;
  gamesAsDefender: number;
  gamesAsPartner: number;
  gamesAsTaker: number;
  gamesPlayed: number;
  player: GamePlayer;
  recentScores: RecentScoreEntry[];
  sessionsPlayed: number;
  starPenalties: number;
  totalStars: number;
  winRateAsTaker: number;
  worstGameScore: number;
}

export interface RecentScoreEntry {
  date: string;
  gameId: number;
  score: number;
  sessionId: number;
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
  currentDealer: GamePlayer | null;
  games: Game[];
  id: number;
  isActive: boolean;
  players: GamePlayer[];
  starEvents: StarEvent[];
}

export interface StarEvent {
  createdAt: string;
  id: number;
  player: GamePlayer;
}

export interface SessionPlayer {
  name: string;
}
