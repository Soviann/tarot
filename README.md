# Tarot — 5-Player Score Tracker

A mobile-first Progressive Web App for tracking scores in 5-player French Tarot, following official FFT rules.

## Features

- **Player management**: create and manage players
- **Session management**: select 5 players to start or auto-resume a session
- **Score entry**: two-step wizard — record the bid at round start, complete with results at round end
- **Score correction**: edit the last game of a session
- **Statistics**: global leaderboard, per-player stats, per-session score evolution charts

## Tech Stack

| Layer    | Technology                                 |
|----------|--------------------------------------------|
| Backend  | Symfony 7.4, API Platform 4, PHP 8.3       |
| Database | MariaDB                                    |
| Frontend | React 19, TypeScript, Vite                 |
| Styling  | Tailwind CSS 4                             |
| PWA      | vite-plugin-pwa                            |
| Data     | TanStack Query                             |
| Local    | DDEV                                       |

## Getting Started

### Prerequisites

- [DDEV](https://ddev.readthedocs.io/) installed
- Node.js 20+

### Setup

```bash
# Clone the repository
git clone git@github.com:Soviann/tarot.git
cd tarot

# Start backend
cd backend
ddev start
ddev composer install
ddev exec bin/console doctrine:migrations:migrate -n

# Start frontend
cd ../frontend
npm install
npm run dev
```

### Access

- **Backend API**: `https://tarot.ddev.site/api`
- **Frontend**: `http://localhost:5173` (Vite dev server)

## Development

### Backend

```bash
ddev exec bin/phpunit                              # Run tests
ddev exec bin/console doctrine:migrations:diff -n  # Generate migration
ddev exec bin/console doctrine:migrations:migrate -n  # Apply migrations
```

### Frontend

```bash
cd frontend
npm run dev      # Dev server
npm test         # Run tests (Vitest)
npm run build    # Production build
```

## Project Management

Issues and roadmap are tracked on the [Tarot - Roadmap](https://github.com/users/Soviann/projects/2) GitHub project board.

## Documentation

- [Design Document](docs/plans/2025-02-05-tarot-app-design.md) — full architecture and design decisions
