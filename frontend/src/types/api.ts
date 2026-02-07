export interface HydraCollection<T> {
  member: T[];
  totalItems: number;
}

export interface Player {
  createdAt: string;
  id: number;
  name: string;
}
