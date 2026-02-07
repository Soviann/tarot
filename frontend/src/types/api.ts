export interface HydraCollection<T> {
  member: T[];
  totalItems: number;
}

export interface Player {
  createdAt: string;
  id: number;
  name: string;
}

export interface Session {
  createdAt: string;
  id: number;
  isActive: boolean;
  players: SessionPlayer[];
}

export interface SessionPlayer {
  name: string;
}
