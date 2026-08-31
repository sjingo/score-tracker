<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# Lions Score Tracker - Domain & Features

## Project Summary

Live score tracking app for under-9 boys football (Lions team). Single-tenant MVP with real-time game & player management.

## Tech Stack

| Layer    | Technology                                |
| -------- | ----------------------------------------- |
| Frontend | React 19.2.8, Next.js 16.3.1 (App Router) |
| Styling  | Tailwind CSS 4                            |
| Language | TypeScript 5                              |
| Database | Turso (libSQL/SQLite) - edge-distributed  |
| SDK      | @libsql/client 0.17.4                     |
| Runtime  | Node.js (Next.js API routes)              |
| Env      | .env.local (Next.js)                      |

## Current Development Database

Development and login testing currently use the configured Turso Cloud database through `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in `.env.local`. The persistent local Turso workflow in `LOCAL_DEVELOPMENT.md` is deferred and should not replace the cloud URL during current testing.

## Architecture Layers (Quick Reference)

```
┌─────────────────────────────────────────────────────────┐
│ PRESENTATION (React + Next.js)                          │
│ - page.tsx (Dashboard with tabs)                        │
│ - GamesView.tsx, PlayersView.tsx (Domain components)   │
│ - AuthStatus.tsx (Auth UI)                              │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ API LAYER (Next.js App Router)                          │
│ - /api/auth/login - Custom email/password auth         │
│ - /api/games/* - Game CRUD + scoring                    │
│ - /api/players/* - Squad management                     │
│ - /api/game-types/* - Match type metadata               │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ BUSINESS LOGIC (Auth & Domain Services)                 │
│ - Password hashing: src/lib/password.ts (bcrypt)        │
│ - DB queries & validation logic                         │
│ - Role-based access control (admin/user)                │
└─────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────┐
│ DATABASE LAYER (Turso/libSQL)                           │
│ - users (auth)                                           │
│ - teams, players, games, game_scorers                   │
│ - game_types, season_stats                              │
│ - SDK: @libsql/client 0.17.4                            │
└─────────────────────────────────────────────────────────┘
```

## Feature Domains

### 🔐 Authentication & Security

- Better Auth user, account, and session tables with native scrypt password hashing
- Email/password login (no OAuth, admin-only user creation)
- Role-based access control: `admin`, `user`
- Single admin user seeded: `s.j.ingolfsson@gmail.com`
- MFA-ready architecture (TOTP, Email OTP, Backup Codes)
- **Routes**: `/api/auth/login`
- **Utilities**: `src/lib/auth.ts` and Better Auth client/route handler
- **Status**: ✅ MVP Complete (Better Auth with email/password)

### 🎮 Game Management

- Create games (opposition, type, date, venue)
- Track match status (in-progress → completed)
- Store opponent score
- Display live scoreboard
- **Routes**: `/api/games`, `/api/games/[gameId]`
- **Components**: `GamesView.tsx`

### ⚽ Score Tracking

- Record goals per player per game
- Auto-increment Lions score
- Prevent duplicate scorer entries
- Track goal counts
- **Routes**: `/api/games/[gameId]/scores`
- **Components**: `GamesView.tsx`

### 👥 Player Management

- Add players (name, jersey number)
- Auto-generate anonymised IDs (`lions_7`)
- Toggle active/inactive status
- Display squad roster
- **Routes**: `/api/players`
- **Components**: `PlayersView.tsx`

### 🏷️ Game Types

- League, Cup, Friendly, Tournament (pre-seeded)
- Custom colors per type
- Non-deletable defaults
- **Routes**: `/api/game-types`

### 📊 Season Statistics (Future)

- Aggregate wins/draws/losses
- Track top scorer
- Goal differential
- **Tables**: `season_stats`

### 🔐 Privacy & Tenancy

- Single Lions team (hardcoded)
- Player anonymisation for GDPR
- Future: multi-tenant via team selector

## Database Schema Index

| Table          | Purpose          | Key Fields                                                                 |
| -------------- | ---------------- | -------------------------------------------------------------------------- |
| `users`        | Authentication   | id, email (unique), password_hash (bcrypt), role (admin/user), is_active   |
| `teams`        | Team identity    | id, team_name                                                              |
| `players`      | Squad roster     | id, name, jersey_number, anonymised_id                                     |
| `game_types`   | Match categories | id, team_id, type_name, display_name, color, is_default                    |
| `games`        | Match records    | id, team_id, opposition_name, score_for, score_against, match_date, status |
| `game_scorers` | Goal tracking    | id, game_id, player_id, goal_count                                         |
| `season_stats` | Aggregated stats | id, team_id, season, total_games, total_wins, total_goals_for              |

## Directory Structure

```
src/
├── app/                    # Next.js App Router (pages & API routes)
│   ├── page.tsx           # Main dashboard
│   ├── login/             # Auth pages
│   ├── api/               # API routes (auth, games, players, game-types)
│   └── globals.css
├── components/            # React components (GamesView, PlayersView, etc)
├── lib/                   # Utilities (db, auth, password)
└── styles/

scripts/                   # Setup & maintenance scripts
└── setup-db.ts           # Database initialization & seeding

public/                   # Static assets
.env.local               # Environment variables (gitignored)
```

## Key Design Patterns

- **Single Tenant**: Lions hardcoded; extensible to multi-tenant
- **Idempotent Init**: Setup script safe to run multiple times
- **Auto-Join Queries**: Games endpoint joins `game_types` for display
- **Auto-Score Updates**: Goal POST auto-increments `games.score_for`
- **Privacy by Default**: Anonymised IDs in all player data

## Feature Index Tags

| Feature  | Tags                                        | Status          |
| -------- | ------------------------------------------- | --------------- |
| Auth     | `#auth #bcrypt #admin #permissions #secure` | ✅ MVP Complete |
| Games    | `#games #crud #scoring #live`               | ✅ MVP          |
| Players  | `#players #squad #roster`                   | ✅ MVP          |
| Types    | `#game-types #metadata #seeded`             | ✅ MVP          |
| Scores   | `#scoring #goals #tracking`                 | ✅ MVP          |
| Tenancy  | `#single-tenant #lions #hardcoded`          | ✅ MVP          |
| Stats    | `#stats #aggregation #season`               | 🔮 Future       |
| Export   | `#export #pdf #csv`                         | 🔮 Future       |
| MFA      | `#mfa #totp #email-otp #backup-codes`       | 🔮 Phase 2      |
| Sessions | `#sessions #jwt #tokens #persistence`       | 🔮 Phase 2      |

## Related Documents

- `.github/DECISION_LOG.md` - Architectural decisions (D001-D018)
- `.github/APP_DOCUMENTATION.md` - Full feature specs & user flows
- `.github/TURSO_SCHEMA.md` - Database schema details
- `.github/schema.sql` - Production SQL
- `.github/PASSWORD_SECURITY_GUIDE.md` - Password security & MFA implementation guide
- `.github/AUTH_COMPLETE_SETUP.md` - Auth setup summary & next steps
