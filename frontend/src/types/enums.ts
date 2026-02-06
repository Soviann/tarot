export const Chelem = {
  AnnouncedLost: "announced_lost",
  AnnouncedWon: "announced_won",
  None: "none",
  NotAnnouncedWon: "not_announced_won",
} as const;

export type Chelem = (typeof Chelem)[keyof typeof Chelem];

export const Contract = {
  Garde: "garde",
  GardeContre: "garde_contre",
  GardeSans: "garde_sans",
  Petite: "petite",
} as const;

export type Contract = (typeof Contract)[keyof typeof Contract];

export const GameStatus = {
  Completed: "completed",
  InProgress: "in_progress",
} as const;

export type GameStatus = (typeof GameStatus)[keyof typeof GameStatus];

export const Poignee = {
  Double: "double",
  None: "none",
  Simple: "simple",
  Triple: "triple",
} as const;

export type Poignee = (typeof Poignee)[keyof typeof Poignee];

export const Side = {
  Attack: "attack",
  Defense: "defense",
  None: "none",
} as const;

export type Side = (typeof Side)[keyof typeof Side];
