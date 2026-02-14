import type { Chelem, Contract, GameStatus, Poignee, Side } from "./enums";

export interface EloHistoryEntry {
  date: string;
  gameId: number;
  ratingAfter: number;
  ratingChange: number;
}

export interface EloEvolutionPlayer {
  history: { date: string; gameId: number; ratingAfter: number }[];
  playerColor: string | null;
  playerId: number;
  playerName: string;
}

export interface EloRankingEntry {
  eloRating: number;
  gamesPlayed: number;
  playerColor: string | null;
  playerId: number;
  playerName: string;
}

export interface ContractSuccessRatePlayer {
  color: string | null;
  contracts: PlayerContractEntry[];
  id: number;
  name: string;
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
  completedAt: string | null;
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
  color: string | null;
  id: number;
  name: string;
}

export interface GlobalStatistics {
  averageGameDuration: number | null;
  contractDistribution: ContractDistributionEntry[];
  contractSuccessRateByPlayer: ContractSuccessRatePlayer[];
  eloEvolution: EloEvolutionPlayer[];
  eloRanking: EloRankingEntry[];
  leaderboard: LeaderboardEntry[];
  totalGames: number;
  totalPlayTime: number;
  totalSessions: number;
  totalStars: number;
}

export interface HydraCollection<T> {
  member: T[];
  totalItems: number;
}

export interface PaginatedCollection<T> extends HydraCollection<T> {
  "hydra:view"?: {
    "hydra:next"?: string;
  };
}

export interface LeaderboardEntry {
  gamesAsTaker: number;
  gamesPlayed: number;
  playerColor: string | null;
  playerId: number;
  playerName: string;
  totalScore: number;
  winRate: number;
  wins: number;
}

export interface Player {
  active: boolean;
  color: string | null;
  createdAt: string;
  id: number;
  name: string;
  playerGroups: PlayerGroup[];
}

export interface PlayerGroup {
  createdAt: string;
  id: number;
  name: string;
}

export interface PlayerGroupDetail extends PlayerGroup {
  players: GamePlayer[];
}

export interface PersonalRecord {
  contract: string | null;
  date: string;
  sessionId: number | null;
  type: string;
  value: number;
}

export interface PlayerContractEntry {
  contract: Contract;
  count: number;
  winRate: number;
  wins: number;
}

export interface PlayerStatistics {
  averageGameDurationSeconds: number | null;
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
  playerGroups: { id: number; name: string }[];
  recentScores: RecentScoreEntry[];
  records: PersonalRecord[];
  sessionsPlayed: number;
  starPenalties: number;
  totalPlayTimeSeconds: number;
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
  lastPlayedAt: string;
  playerGroup: PlayerGroup | null;
  players: SessionPlayer[];
}

export interface SessionAward {
  description: string;
  playerColor: string | null;
  playerId: number;
  playerName: string;
  title: string;
}

export interface SessionDetail {
  createdAt: string;
  cumulativeScores: CumulativeScore[];
  currentDealer: GamePlayer | null;
  id: number;
  inProgressGame?: Game | null;
  isActive: boolean;
  playerGroup: PlayerGroup | null;
  players: GamePlayer[];
  starEvents: StarEvent[];
}

export interface SessionHighlights {
  bestGame: { contract: string; gameId: number; playerName: string; score: number } | null;
  duration: number;
  lastPlace: { playerId: number; playerName: string; score: number } | null;
  mostPlayedContract: { contract: string; count: number } | null;
  mvp: { playerId: number; playerName: string; score: number } | null;
  totalGames: number;
  totalStars: number;
  worstGame: { contract: string; gameId: number; playerName: string; score: number } | null;
}

export interface SessionPlayer {
  color: string | null;
  id: number;
  name: string;
}

export interface SessionRankingEntry {
  playerColor: string | null;
  playerId: number;
  playerName: string;
  position: number;
  score: number;
}

export interface SessionSummary {
  awards: SessionAward[];
  highlights: SessionHighlights;
  ranking: SessionRankingEntry[];
  scoreSpread: number;
}

export interface StarEvent {
  createdAt: string;
  id: number;
  player: GamePlayer;
}
