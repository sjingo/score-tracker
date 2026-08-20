# Decision Log - Lions Score Tracker

## Instructions for LLM Updates

**CRITICAL READING REQUIREMENT**: Before updating this log, read this section completely.

### Decision Precedence Rule

- **Any subsequent decision overrides a previous decision**
- When a decision contradicts an earlier entry, the newer entry takes precedence
- Do NOT maintain conflicting decisions—update or remove obsolete entries
- Always note when a decision supersedes a previous one

### Entry Format

Each decision entry must follow this structure:

```
## [Decision ID] - [Short Title]
**Date**: YYYY-MM-DD
**Status**: Active | Superseded | On Hold
**Overrides**: [If applicable, reference previous decision ID]

### Summary of Changes
Brief description of what was decided.

### Rationale
Why this decision was made. Constraints, trade-offs, or benefits.

### Minimal Code Example
Key code snippet or configuration (if applicable). Keep to 5-10 lines max.

### Feature Domain(s)
- Database
- API
- UI
- Infrastructure
- Type Safety
- Performance
- etc.

### Index Tags
`#tag1 #tag2 #tag3`
```

---

## Decision Entries

### D001 - Use @libsql/client SDK for Turso Connection

**Date**: 2026-08-19  
**Status**: Active

**Summary of Changes**
Selected `@libsql/client` SDK for connecting to Turso remote database instead of `@tursodatabase/serverless`.

**Rationale**

- Already installed in dependencies
- Works with Next.js API routes
- Compatible with ORM integration (Drizzle, Prisma) for future scalability
- Handles remote libSQL databases on Turso Cloud

**Minimal Code Example**

```typescript
import { createClient } from "@libsql/client";

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});
```

**Feature Domain(s)**

- Database
- Infrastructure

**Index Tags**
`#database #turso #sdk #remote`

---

### D002 - Turso Database Schema & Initialization

**Date**: 2026-08-19  
**Status**: Active

**Summary of Changes**
Created 6-table schema with full database initialization via TypeScript setup script. Tables: teams, players, game_types, games, game_scorers, season_stats. Lions team and default game types (League, Cup, Friendly, Tournament) seeded on first run.

**Rationale**

- Idempotent initialization (safe to run multiple times)
- Automated setup reduces manual errors
- Schema supports single-tenant (Lions) + extensibility for future teams
- Foreign keys enforce data integrity

**Minimal Code Example**

```typescript
// scripts/setup-db.ts
const createTablesSQL = `
  CREATE TABLE IF NOT EXISTS teams (id TEXT PRIMARY KEY, team_name TEXT);
  CREATE TABLE IF NOT EXISTS players (id TEXT PRIMARY KEY, ...);
  CREATE TABLE IF NOT EXISTS games (...);
`;
await db.execute(statement.trim());
```

**Feature Domain(s)**

- Database
- Infrastructure

**Index Tags**
`#database #schema #turso #initialization #seeding`

---

### D003 - API Route Structure for Score Tracking

**Date**: 2026-08-19  
**Status**: Active

**Summary of Changes**
Created 6 API endpoints:

- `/api/team` - GET Lions team
- `/api/players` - GET/POST players
- `/api/game-types` - GET game types
- `/api/games` - GET/POST games
- `/api/games/[gameId]` - GET/PATCH specific game
- `/api/games/[gameId]/scores` - GET/POST goal tracking

**Rationale**

- RESTful design following Next.js App Router conventions
- Automatic Lions team lookup (hardcoded to single tenant)
- Goal recording auto-updates game score
- Consistent error handling and JSON responses

**Minimal Code Example**

```typescript
// /api/games/[gameId]/scores route.ts
export async function POST(request, { params }) {
  const { playerId, playerName, goalCount } = await request.json();
  // Insert into game_scorers, auto-increment game.score_for
}
```

**Feature Domain(s)**

- API
- Database

**Index Tags**
`#api #rest #scoring #game-management`

---

### D004 - Environment Variables: .env.local for Next.js

**Date**: 2026-08-19  
**Status**: Active

**Summary of Changes**
Store Turso credentials in `.env.local` with keys:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

File is committed to `.gitignore` (default Next.js setup).

**Rationale**

- Next.js automatically loads `.env.local` for development
- Keeps secrets out of version control
- Consistent with Next.js best practices
- Accessible in both server and API routes

**Minimal Code Example**

```env
TURSO_DATABASE_URL=libsql://score-tracker-sjingo.aws-eu-west-1.turso.io
TURSO_AUTH_TOKEN=eyJhbGc...
```

**Feature Domain(s)**

- Infrastructure
- Security

**Index Tags**
`#env #secrets #next.js #turso`

---

### D005 - Tab-Based Dashboard UI with React Components

**Date**: 2026-08-19  
**Status**: Active

**Summary of Changes**
Created main dashboard with two views:

- **GamesView**: Create games, display scores, track match status
- **PlayersView**: Add players, display squad with jersey numbers

Tab navigation in `page.tsx` switches between views using React state.

**Rationale**

- Clean separation of concerns (Games vs Squad management)
- Intuitive UX for coaches/admins
- Reusable components for potential sub-pages
- Tailwind CSS for consistent styling

**Minimal Code Example**

```typescript
// page.tsx - Tab state
const [activeTab, setActiveTab] = useState<"games" | "players">("games");
// Render: {activeTab === "games" ? <GamesView /> : <PlayersView />}
```

**Feature Domain(s)**

- UI
- React Components

**Index Tags**
`#ui #dashboard #react #tabs #games #players`

---

### D006 - Single Tenant: Lions Team Hardcoded

**Date**: 2026-08-19  
**Status**: Active

**Summary of Changes**
All API routes automatically reference the Lions team by querying `teams WHERE team_name = 'Lions'`. No team_id selector in UI.

**Rationale**

- MVP scope: single team only
- Reduces complexity in UI and API
- Easy to convert to multi-tenant later (add team selector)
- Schema supports future expansion without changes

**Minimal Code Example**

```typescript
const teamsResult = await db.execute(
  "SELECT id FROM teams WHERE team_name = 'Lions'",
);
const lionsTeamId = teamsResult.rows[0].id;
```

**Feature Domain(s)**

- Database
- API
- Architecture

**Index Tags**
`#tenancy #lions #single-tenant #scope`

---

### D007 - Player Anonymisation with Anonymised ID

**Date**: 2026-08-19  
**Status**: Active

**Summary of Changes**
Each player gets an `anonymised_id` field (e.g., `lions_7` or `lions_abc12345`) for privacy. Displayed in UI but not visible on live scoreboards (future).

**Rationale**

- Supports GDPR/privacy requirements for youth sports
- Decouples player identity from performance data
- Can distribute live scoreboards without revealing real names

**Minimal Code Example**

```typescript
const anonymisedId = `lions_${jerseyNumber || randomUUID().slice(0, 8)}`;
```

**Feature Domain(s)**

- Database
- Privacy
- UI

**Index Tags**
`#privacy #gdpr #anonymisation #youth-sports`

---

### D008 - Tailwind CSS for Styling

**Date**: 2026-08-19  
**Status**: Active

**Summary of Changes**
All UI components use Tailwind CSS utility classes. Already installed as project dependency.

**Rationale**

- Rapid prototyping and consistency
- Built-in dark mode support (if needed)
- No additional CSS files to maintain
- Responsive by default

**Minimal Code Example**

```tsx
<button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
  Create Game
</button>
```

**Feature Domain(s)**

- UI
- Styling

**Index Tags**
`#styling #tailwind #css #ui`

---

### D009 - Single Player Name Field

**Date**: 2026-08-20  
**Status**: Active

**Summary of Changes**
Consolidated player name storage from separate `first_name` and `last_name` fields to a single `name` field. Schema, API routes, and UI components updated accordingly.

**Rationale**

- MVP requirement: "we don't care and we might not know" name structure
- Simplifies data entry (one input field instead of two)
- Reduces validation complexity
- Accommodates full names, nicknames, or any naming convention without parsing
- Can be split into separate fields later if needed (data migration)

**Minimal Code Example**

```typescript
// Players table
CREATE TABLE players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  jersey_number INTEGER,
  anonymised_id TEXT UNIQUE,
  is_active BOOLEAN DEFAULT 1
);

// API POST
const { name, jerseyNumber } = body;
// Single input in UI: <input placeholder="Player name" />
```

**Feature Domain(s)**

- Database
- API
- UI
- Player Management

**Index Tags**
`#players #data-model #simplicity #mvp`

---

### D010 - Opposition Teams as String, Not Entities

**Date**: 2026-08-20  
**Status**: Active

**Summary of Changes**
Opposition teams are recorded as text strings (`games.opposition_name`) only. No separate `teams` entity for opponents. Only Lions team exists in `teams` table as the single-tenant app entity.

**Rationale**

- MVP scope: single-tenant Lions app only
- Opposition teams are transient match data, not managed entities
- No need to track opponent records, schedules, or statistics
- Simplifies schema and avoids unnecessary joins
- If multi-tenant needed later: add `teams.type` (enum: 'our_team' vs 'opponent') and migrate data
- Opposition name serves league table filtering/display

**Minimal Code Example**

```typescript
// Games table
CREATE TABLE games (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL, -- Always Lions
  opposition_name TEXT NOT NULL, -- "City FC", "United", etc.
  score_for INTEGER DEFAULT 0,
  score_against INTEGER DEFAULT 0,
  FOREIGN KEY (team_id) REFERENCES teams(id)
);

// Players: implicit Lions membership, no team_id FK
CREATE TABLE players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  -- No team_id; always Lions
);
```

**Feature Domain(s)**

- Database
- Architecture
- Tenancy

**Index Tags**
`#tenancy #opposition #single-tenant #games #opposition-name`

---

### D011 - Initial Lions Roster Seeding

**Date**: 2026-08-20  
**Status**: Active

**Summary of Changes**
Database setup script seeds 10 initial Lions players on first run. Players include 2 with known jersey numbers and 8 without. Anonymised IDs auto-generated based on jersey number or UUID.

**Rationale**

- MVP launch requirement: roster known and stable
- Idempotent seeding: safe to re-run setup script
- Supports quick start without manual player entry
- Anonymised ID generation enables privacy-friendly displays

**Minimal Code Example**

```typescript
// scripts/setup-db.ts
const initialRoster = [
  { name: "Paddy Doonan-Riley", jerseyNumber: 7 },
  { name: "Ari Ingolfsson", jerseyNumber: 18 },
  { name: "Josh", jerseyNumber: null },
  // ... 7 more without jersey numbers
];

// Seeded after Lions team and game types creation
// Idempotent check: if COUNT(players) > 0, skip
```

**Roster Data:**

- **With Jersey Numbers**: Paddy Doonan-Riley (7), Ari Ingolfsson (18)
- **Without Jersey Numbers**: Josh, Stanley, Franklin, Logan, Suli, Sulimain, Alex, Harry

**Anonymised ID Format:**

- If jersey number present: `lions_{jerseyNumber}` (e.g., `lions_7`)
- If no jersey number: `lions_{random8chars}` (e.g., `lions_abc12345`)

**Feature Domain(s)**

- Database
- Infrastructure
- Player Management

**Index Tags**
`#seeding #roster #initialization #idempotent #u9-lions`

---

### D012 - Jersey Number Validation (1-99 Range)

**Date**: 2026-08-20  
**Status**: Active

**Summary of Changes**
Added validation constraint on `jersey_number` field: must be NULL (optional) or between 1-99. Validation enforced at three levels: database CHECK constraint, API route validation, and frontend form constraints.

**Rationale**

- Jersey numbers are optional but bounded when provided
- U9 squad unlikely to exceed 99 players (realistic constraint)
- Can have duplicate jersey numbers (randomUUID is unique player ID)
- Multi-layer validation: database (integrity), API (client feedback), UI (UX)
- Prevents data entry errors without blocking optional entries

**Minimal Code Example**

```typescript
// Database: CHECK constraint
jersey_number INTEGER CHECK (jersey_number IS NULL OR (jersey_number >= 1 AND jersey_number <= 99))

// API: Validation before insert
if (jerseyNumber && (jerseyNumber < 1 || jerseyNumber > 99)) {
  return error("Jersey number must be between 1 and 99");
}

// UI: HTML5 input constraints
<input type="number" min="1" max="99" placeholder="Jersey Number (1-99)" />
```

**Feature Domain(s)**

- Database
- API
- UI
- Data Validation

**Index Tags**
`#validation #constraint #data-integrity #jersey #optional`

---

### D013 - Player Active/Inactive Status

**Date**: 2026-08-20  
**Status**: Active

**Summary of Changes**
Players have an `is_active` boolean field (default=1) to track active/inactive status. All seeded players default to active. Inactive players are filtered out of player listing endpoints.

**Rationale**

- Supports squad rotation and player availability tracking
- Soft-delete pattern: no data loss, deactivation reversible
- All seeded players begin as active (default=1)
- GET /api/players filters to active only: `WHERE is_active = 1`
- Future feature: toggle endpoint to deactivate/reactivate players
- Maintains player history for historical stats even if no longer active

**Minimal Code Example**

```typescript
// Schema
is_active BOOLEAN DEFAULT 1

// API GET: filters to active only
SELECT * FROM players WHERE is_active = 1

// Future toggle endpoint
PATCH /api/players/[playerId]
{ "is_active": false }
```

**Feature Domain(s)**

- Database
- API
- Player Management

**Index Tags**
`#player-status #active #soft-delete #squad-management`

---

### D014 - MVP Player Data Model: Core Fields Only

**Date**: 2026-08-20  
**Status**: Active

**Summary of Changes**
Player table limited to essential MVP fields only: `id`, `name`, `jersey_number`, `anonymised_id`, `is_active`. No position, DOB, contact info, or appearance data (colors, etc.) in MVP.

**Rationale**

- MVP scope: score tracking only, not player profile management
- Keeps schema simple and focused
- Reduces data entry burden on coaches
- Future-proof: can add fields without breaking existing data
- Contact/DOB management deferred to future phases or external system
- Position tracking can be added per-game if needed later

**Minimal Code Example**

```typescript
// Current MVP player schema
CREATE TABLE players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  jersey_number INTEGER CHECK (...),
  anonymised_id TEXT UNIQUE,
  is_active BOOLEAN DEFAULT 1
);

// Future expansion example (not implemented)
// position TEXT
// date_of_birth TEXT
// parent_contact TEXT
```

**Feature Domain(s)**

- Database
- Player Management
- Scope

**Index Tags**
`#mvp #scope #data-model #player #simplicity`

---

### D015 - Game Location: Home/Away Field

**Date**: 2026-08-20  
**Status**: Active

**Summary of Changes**
Added `location` field to games table with constraint: `CHECK (location IN ('home', 'away'))`. Captures whether Lions played as home team or away team. Nullable in database but required in API POST/PATCH.

**Rationale**

- Supports venue-based statistics: home/away win rates, performance analysis
- Simple enum (home/away) avoids complex venue management
- Complements `venue` field (which stores venue name: "Home Park", "Central Ground", etc.)
- Enables filtering results: "Show all home games", "Away record"
- MVP requirement: coaches track home vs away performance

**Minimal Code Example**

```typescript
// Schema: Check constraint enforces home/away only
CREATE TABLE games (
  id TEXT PRIMARY KEY,
  location TEXT CHECK (location IN ('home', 'away')),
  venue TEXT, -- Venue name: "Home Park", "City Stadium", etc.
  ...
);

// API UI: Radio buttons or dropdown
<select name="location" required>
  <option value="">Select...</option>
  <option value="home">Home</option>
  <option value="away">Away</option>
</select>
```

**Feature Domain(s)**

- Database
- API
- UI
- Game Management

**Index Tags**
`#games #location #home-away #venue #statistics`

---

## Quick Reference Index

### By Domain

- **Database**: D002, D004, D006, D009, D010, D011, D012, D013, D014, D015
- **API**: D003, D006, D009, D012, D013, D015
- **UI**: D005, D008, D009, D012, D015
- **Infrastructure**: D001, D002, D004, D011
- **Privacy**: D007
- **Architecture**: D006, D010
- **Player Management**: D005, D007, D009, D011, D012, D013, D014
- **Data Validation**: D012
- **Scope**: D014
- **Game Management**: D003, D005, D010, D015

### By Feature

- **Score Tracking**: D003
- **Game Management**: D003, D005, D010, D015
- **Player Management**: D005, D007, D009, D011, D012, D013, D014
- **Team Tenancy**: D006, D010
- **Secrets Management**: D004
- **Roster Seeding**: D011
- **Data Validation**: D012
- **Player Status**: D013
- **MVP Scope**: D014
- **Venue & Location**: D015

### Active Decisions

`#active`: D001, D002, D003, D004, D005, D006, D007, D008, D009, D010, D011, D012, D013, D014, D015
