# Tarot 5-Player Scoring App — Design Document

**Date**: 2025-02-05
**Status**: Approved

## Overview

A mobile-first PWA for tracking scores in 5-player French Tarot following official FFT rules. Server-side data storage allows any player to enter scores. Built with Symfony 7.4 + API Platform (backend) and React 19 + TypeScript (frontend).

## Data Model

### Player

| Field     | Type   | Notes          |
|-----------|--------|----------------|
| id        | int    | PK, auto-increment |
| name      | string | unique, required |
| createdAt | datetime |              |

### Session

| Field     | Type     | Notes                          |
|-----------|----------|--------------------------------|
| id        | int      | PK, auto-increment             |
| createdAt | datetime |                                |
| isActive  | bool     | default true                   |
| players   | M2M      | exactly 5 Players (ordered)    |

### Game

| Field        | Type   | Notes                                              |
|--------------|--------|-----------------------------------------------------|
| id           | int    | PK, auto-increment                                  |
| session      | M2O    | → Session                                           |
| status       | enum   | in_progress, completed                              |
| taker        | M2O    | → Player                                            |
| partner      | M2O    | → Player, nullable (taker calls own king)           |
| contract     | enum   | petite, garde, garde_sans, garde_contre             |
| oudlers      | int    | 0–3, nullable (set on completion)                   |
| points       | float  | nullable (set on completion)                        |
| poignee      | enum   | none, simple, double, triple                        |
| poigneeOwner | enum   | none, attack, defense                               |
| petitAuBout  | enum   | none, attack, defense                               |
| chelem       | enum   | none, announced_won, announced_lost, not_announced_won |
| position     | int    | order within session                                |
| createdAt    | datetime |                                                   |

### ScoreEntry

| Field  | Type | Notes                                  |
|--------|------|----------------------------------------|
| id     | int  | PK, auto-increment                     |
| game   | M2O  | → Game                                 |
| player | M2O  | → Player                               |
| score  | int  | points gained/lost for this game       |

Score entries are created only when a Game transitions to `completed`.

## Score Calculation — Official FFT Rules (5 players)

### Base score

```
Points needed to win based on oudlers:
  0 oudlers → 56 points
  1 oudler  → 51 points
  2 oudlers → 41 points
  3 oudlers → 36 points

Base = (|points - required| + 25) × contract_multiplier
  petite = ×1, garde = ×2, garde_sans = ×4, garde_contre = ×6

If taker's side has fewer points than required → base is negative.
```

### Bonuses (added/subtracted independently of contract multiplier)

```
Poignée:
  simple (8 trumps in 5-player) = 20
  double (10 trumps)            = 30
  triple (13 trumps)            = 40
  → Always positive, awarded to the winning side regardless of who showed it.

Petit au bout:
  10 × contract_multiplier
  → positive if won by the side that played it, negative otherwise.

Chelem:
  announced + won    = +400
  announced + lost   = -200
  not announced + won = +200
```

### Distribution (5 players)

```
Taker:   base × 2  (plays against 3, partner covers 1)
Partner: base × 1
Each defender: base × -1

When taker calls own king (no partner):
  Taker:   base × 4
  Each defender: base × -1
```

## API Endpoints

### Players
- `GET    /api/players` — list all
- `POST   /api/players` — create `{ name }`
- `PATCH  /api/players/{id}` — update name

### Sessions
- `GET    /api/sessions` — list (filterable by player IDs)
- `POST   /api/sessions` — create `{ playerIds[5] }`, auto-finds existing active session
- `GET    /api/sessions/{id}` — detail with cumulative scores and games

### Games
- `POST   /api/sessions/{id}/games` — create game (step 1: taker + contract)
- `PATCH  /api/games/{id}` — complete game (step 2) or edit last game
- `GET    /api/sessions/{id}/games` — list games in session

### Statistics
- `GET    /api/statistics` — global leaderboard & aggregates
- `GET    /api/statistics/players/{id}` — player detail stats
- `GET    /api/statistics/sessions/{id}` — session stats

## Frontend Screens

### Bottom Navigation
Three tabs: **Home** | **Stats** | **Players**

### Home Screen
- Search/select 5 players with inline "+ Add player"
- "Start" button → POST /api/sessions (backend finds or creates)
- Recent sessions list below for quick resume

### Session Screen
- **Scoreboard header**: 5 player cards in horizontal scroll, cumulative scores, color-coded (green/red)
- **In-progress game banner** (if any): prominent card with taker + contract, "Complete" button
- **Game history**: cards list, most recent first
- **FAB "+"**: new game (disabled if one is in progress)
- **Swipe left on last game**: edit action
- **Player avatars**: auto-generated from initials with distinct colors

### Score Entry — Step 1 (Start of round)
- Select taker (tap one of 5 player avatars)
- Select contract (4 large tappable buttons)
- Save → game created as `in_progress`

### Score Entry — Step 2 (End of round)
- Select partner (tap avatar, or "Self" option)
- Oudlers stepper (0–3)
- Points input (numeric)
- Bonuses section (collapsed by default)
- Preview: computed score breakdown shown before validation
- Validate → scores computed & saved

### Players Screen
- List of all players with search
- Add new player
- Tap player → player stats

### Stats Screen
- Tabs: **Global** | **By Player** | **By Session**
- Global: leaderboard, total games, win rates
- Player: games played, avg score, contracts distribution, best/worst game
- Session: score evolution line chart, game-by-game breakdown

## Design System

### Theme
- **Light theme** (default) with dark mode toggle
- Clean white/gray backgrounds, subtle card shadows
- Accent color: deep royal blue (#1e3a5f) — evokes card game elegance

### Visual Elements
- **Player avatars**: colored circles with initials, consistent color per player
- **Score animations**: counter rolling up/down on game completion
- **Contract badges**: colored chips (green → petite, blue → garde, orange → garde sans, red → garde contre)
- **Confetti** on chelem or big point swings
- **Swipe gestures** on last game card for edit

### Typography
- System font stack for performance
- Score numbers in tabular figures (monospace digits)

## Tech Stack

| Layer    | Technology                                    |
|----------|-----------------------------------------------|
| Backend  | Symfony 7.4, API Platform 4, PHP 8.3          |
| Database | MariaDB (DDEV default)                        |
| Frontend | React 19, TypeScript, Vite                    |
| Styling  | Tailwind CSS 4                                |
| PWA      | vite-plugin-pwa                               |
| Data     | TanStack Query                                |
| Testing  | PHPUnit (backend), Vitest (frontend)          |
| Local    | DDEV                                          |

## Project Structure

```
tarot/
├── backend/
│   ├── .ddev/
│   ├── src/
│   │   ├── Entity/          # Player, Session, Game, ScoreEntry
│   │   ├── Enum/            # Contract, Poignee, PetitAuBout, Chelem, GameStatus
│   │   ├── Service/         # ScoreCalculator
│   │   └── State/           # API Platform processors
│   ├── migrations/
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   └── public/
│       └── manifest.json
├── docs/
│   └── plans/
├── CLAUDE.md
├── README.md
└── CHANGELOG.md
```

## Future: Star System (Phase 2)

Not part of initial implementation. Data model extension planned:

```
StarEvent
├── id (int, auto-increment)
├── session (M2O → Session)
├── player (M2O → Player)
├── createdAt

Rules:
- 3 stars on a session → -100 points for player, +25 for 4 others
- Reset to 0 stars after penalty
- Track history for statistics
```
