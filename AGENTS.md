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

## Feature Domains

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

| Table          | Purpose          | Key Fields                                                               |
| -------------- | ---------------- | ------------------------------------------------------------------------ |
| `teams`        | Team identity    | id, team_name                                                            |
| `players`      | Squad roster     | id, first_name, last_name, jersey_number, **anonymised_id**              |
| `game_types`   | Match categories | id, type_name, display_name, color, is_default                           |
| `games`        | Match records    | id, opposition_name, score_for, score_against, match_date, status, venue |
| `game_scorers` | Goal tracking    | id, game_id, player_id, goal_count                                       |
| `season_stats` | Aggregated stats | id, season, total_games, total_wins, total_goals_for                     |

## Directory Structure

```
src/
├── app/
│   ├── page.tsx              # Main dashboard (Games/Players tabs)
│   ├── globals.css
│   └── api/
│       ├── team/route.ts
│       ├── players/route.ts
│       ├── games/route.ts
│       ├── games/[gameId]/route.ts
│       ├── games/[gameId]/scores/route.ts
│       └── game-types/route.ts
├── components/
│   ├── GamesView.tsx         # Game CRUD + live display
│   ├── PlayersView.tsx       # Squad management
│   └── Button.tsx            # UI primitives
├── lib/
│   └── db.ts                 # Turso client singleton
└── styles/
    └── globals.css

scripts/
└── setup-db.ts               # DB initialization + seeding
```

## Key Design Patterns

- **Single Tenant**: Lions hardcoded; extensible to multi-tenant
- **Idempotent Init**: Setup script safe to run multiple times
- **Auto-Join Queries**: Games endpoint joins `game_types` for display
- **Auto-Score Updates**: Goal POST auto-increments `games.score_for`
- **Privacy by Default**: Anonymised IDs in all player data

## Feature Index Tags

| Feature | Tags                               | Status    |
| ------- | ---------------------------------- | --------- |
| Games   | `#games #crud #scoring #live`      | ✅ MVP    |
| Players | `#players #squad #roster`          | ✅ MVP    |
| Types   | `#game-types #metadata #seeded`    | ✅ MVP    |
| Scores  | `#scoring #goals #tracking`        | ✅ MVP    |
| Tenancy | `#single-tenant #lions #hardcoded` | ✅ MVP    |
| Stats   | `#stats #aggregation #season`      | 🔮 Future |
| Auth    | `#auth #admin #permissions`        | 🔮 Future |
| Export  | `#export #pdf #csv`                | 🔮 Future |

## Related Documents

- `DECISION_LOG.md` - Architectural decisions (D001-D008)
- `APP_DOCUMENTATION.md` - Full feature specs & user flows
- `TURSO_SCHEMA.md` - Database schema details
- `schema.sql` - Production SQL
