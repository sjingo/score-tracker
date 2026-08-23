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

### D016 - Exclude setup-db.ts from Git Due to PII

**Date**: 2026-08-20  
**Status**: Active

**Summary of Changes**
Added `scripts/setup-db.ts` to `.gitignore` to prevent seeded player roster data from being committed to GitHub. The setup script contains hardcoded player names (e.g., "Paddy Doonan-Riley", "Ari Ingolfsson") which are PII.

**Rationale**

- MVP launched with seeded roster for quick testing/demo
- Seeded player names are real individuals (children under 9)
- GDPR compliance: prevents personal data from being pushed to public/private repo
- Developers can still run `npm run setup:db` locally after cloning (idempotent)
- .env files already in .gitignore, so this follows existing secret/data protection pattern
- Keeps scope clear: repo contains code & schema, not test data

**Minimal Code Example**

```gitignore
# database setup scripts (contain seeded PII)
scripts/setup-db.ts
```

**Feature Domain(s)**

- Infrastructure
- Privacy
- Security

**Index Tags**
`#privacy #pii #gitignore #security #gdpr #seeding`

---

### D017 - Authentication with Better Auth & OAuth (Google, Facebook)

**Date**: 2026-08-20  
**Status**: Superseded by D018, then D023

**Summary of Changes**
Implemented authentication using Better Auth with support for:

- Email/password authentication
- OAuth social providers: Google and Facebook
- Turso (libSQL) database adapter for session/user management
- API route handler at `/api/auth/[...all]/route.ts`
- Client-side auth utilities: `signIn`, `signUp`, `signOut`, `useSession`
- Public login and signup pages
- Auth status component in header showing user info and logout button

**Rationale**

- Better Auth: industry-standard, well-maintained, battle-tested
- Turso adapter: native libSQL support, works seamlessly with existing @libsql/client
- OAuth providers: reduces friction (users login with existing Google/Facebook accounts)
- Email/password: fallback for users without OAuth accounts
- Session/user tables auto-created by Better Auth (separate from Lions domain tables)
- Single-tenant scope maintained: auth layer orthogonal to game/player data
- Privacy-friendly: Better Auth handles secrets securely, supports session expiry

**Minimal Code Example**

```typescript
// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { libSqlAdapter } from "better-auth/adapters/libsql";

export const auth = betterAuth({
  database: libSqlAdapter(db),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
  emailAndPassword: { enabled: true },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    },
  },
});

// src/app/api/auth/[...all]/route.ts
export const { POST, GET } = toNextJsHandler(auth);

// Component usage
const { data: session } = useSession();
await signIn.email({ email, password });
await signIn.social({ provider: "google", callbackURL: "/" });
await signOut();
```

**Environment Variables**

```env
BETTER_AUTH_SECRET=<32-byte base64 secret>
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
FACEBOOK_CLIENT_ID=<from Facebook Developers>
FACEBOOK_CLIENT_SECRET=<from Facebook Developers>
```

**Key Files Created**

- `src/lib/auth.ts` - Better Auth configuration
- `src/lib/auth-client.ts` - Client-side auth utilities
- `src/app/api/auth/[...all]/route.ts` - API handler
- `src/app/login/page.tsx` - Login page with email + OAuth
- `src/app/signup/page.tsx` - Signup page with email + OAuth
- `src/components/AuthStatus.tsx` - Header component (user info + logout)

**Feature Domain(s)**

- Authentication
- Infrastructure
- Security
- UI
- API

**Index Tags**
`#auth #better-auth #oauth #google #facebook #session #security #turso #libsql`

---

### D018 - Authentication: Custom Email/Password with bcrypt (No OAuth)

**Date**: 2026-08-20  
**Status**: Superseded by D023  
**Overrides**: D017 (Better Auth with OAuth)

### Summary of Changes

Authentication system changed from Better Auth with OAuth (Google, Facebook) to a custom email/password implementation with bcrypt password hashing and Turso database integration. Key changes:

- ✅ Removed OAuth configuration (Google, Facebook)
- ✅ Created `users` table in Turso with: id, email, password_hash, role (admin/user), is_active, created_at, last_login, updated_at
- ✅ Implemented bcrypt password hashing (12 salt rounds) in `src/lib/password.ts`
- ✅ Created login API endpoint: `POST /api/auth/sign-in/email`
- ✅ Seeded admin user: `s.j.ingolfsson@gmail.com` with default password `ChangeMe@123`
- ✅ Simplified auth configuration to just AUTH_ROLES type export

### Rationale

- **No sign-up needed**: MVP requirement—Lions is single-team, admin-only user management
- **Security first**: bcrypt (12 rounds) is industry-standard password hashing (OWASP A02:2021 compliant)
- **Simplicity**: Removes complexity of OAuth provider setup and configuration
- **Admin control**: Users added only via Turso console or admin API (to build)
- **Privacy**: No reliance on third-party services; all data in own database
- **Role-based access**: Support for 'admin' and 'user' roles built-in
- **Cost**: Zero dependency costs (bcrypt is free, npm package)
- **Scalability**: Easy to add TOTP MFA or other auth mechanisms later

### Minimal Code Example

```typescript
// src/lib/password.ts - Password utilities
import bcrypt from 'bcrypt';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12); // 12 salt rounds
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// src/app/api/auth/login/route.ts - Login endpoint
export async function POST(request: Request) {
  const { email, password } = await request.json();
  const user = await db.execute(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );

  if (user.rows.length === 0 || !await verifyPassword(password, user.rows[0].password_hash)) {
    return Response.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // Update last_login and return user
  await db.execute("UPDATE users SET last_login = ? WHERE id = ?", [new Date().toISOString(), user.rows[0].id]);
  return Response.json({ user: { id: user.rows[0].id, email: user.rows[0].email, role: user.rows[0].role } });
}

// Database schema
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  is_active BOOLEAN DEFAULT 1,
  created_at TEXT NOT NULL,
  last_login TEXT,
  updated_at TEXT NOT NULL
);
```

### Security Posture

| Metric                   | Value                                                |
| ------------------------ | ---------------------------------------------------- |
| **Algorithm**            | bcrypt                                               |
| **Salt Rounds**          | 12 (OWASP recommended: 10-12)                        |
| **Hash Time**            | ~100ms per password                                  |
| **Estimated Crack Time** | 30+ years (8 GPU cards @ 9.6B hashes/sec)            |
| **Default Password**     | ChangeMe@123 (must change on first login)            |
| **MFA Ready**            | TOTP/email codes can be added without schema changes |

### MFA Options (Free, to implement later)

1. **TOTP** (recommended): Google Authenticator, Authy, Microsoft Authenticator
2. **Email codes**: 6-digit codes sent via email (5-10 min expiry)
3. **Backup codes**: One-time recovery codes for account access if device lost

See `PASSWORD_SECURITY_GUIDE.md` for full MFA implementation details.

### Key Files Created/Modified

- `src/lib/auth.ts` - Simplified (AUTH_ROLES types only)
- `src/lib/password.ts` - NEW: bcrypt hash/verify utilities
- `src/app/api/auth/login/route.ts` - NEW: Login endpoint
- `scripts/setup-db.ts` - Updated: users table schema + admin seeding
- `PASSWORD_SECURITY_GUIDE.md` - NEW: Comprehensive security & MFA guide

### Feature Domain(s)

- Authentication
- Security
- Database
- API
- Infrastructure
- Privacy

### Index Tags

`#auth #custom #bcrypt #no-oauth #email-password #admin-only #turso #security #mfa-ready`

---

### D019 - Align Authentication with the Deployed Users Schema

**Date**: 2026-08-23
**Status**: Superseded by D023
**Overrides**: The Better Auth table assumptions in D017 and the conflicting account-table implementation described during the D018 transition.

### Summary of Changes

The custom sign-in endpoint now matches the users schema used by the remote database. It selects `users.password_hash` and verifies it with bcrypt. It no longer selects the nonexistent `users.name` column or reads credentials from a separate `account` table.

The local setup script creates and seeds the same `users` schema so local initialization does not recreate the remote authentication failure.

### Rationale

- The remote database returned `SQL_INPUT_ERROR: no such column: name`, proving the SQL endpoint was reachable and the query schema was wrong.
- Existing authentication documentation and the deployed schema contract use `password_hash` on `users`.
- Keeping one custom authentication schema avoids silently diverging local and remote environments.
- The Turso analytics-service warning is independent of SQL database connectivity.

### Minimal Code Example

```typescript
const userResult = await db.execute(
  "SELECT id, email, password_hash, role, is_active FROM users WHERE email = ?",
  [email],
);
const passwordMatch = await verifyPassword(password, user.password_hash);
```

### Feature Domain(s)

- Authentication
- Database
- API
- Security

### Index Tags

`#auth #custom #bcrypt #schema-alignment #remote #turso #debugging`

---

### D020 - Persistent Local Turso Development Database

**Date**: 2026-08-23
**Status**: On Hold
**Overrides**: Superseded for current development by D021

### Summary of Changes

The project has a documented option to use the Turso CLI with a persistent SQLite file and local libSQL HTTP server:

```powershell
turso dev --db-file local.db
```

The application can connect to `http://127.0.0.1:8080` through `@libsql/client`. Local schema and seed data are initialized with `npm run setup:db` and are isolated from Turso Cloud.

This option is on hold. Current development and login testing use the configured Turso Cloud database, as defined by D021. Local setup is retained as a future development workflow only.

The full workflow is documented in `LOCAL_DEVELOPMENT.md`.

### Rationale

- Follows Turso's recommended local-development workflow.
- Avoids cloud usage and quota costs during development.
- Persists local changes between server restarts.
- Makes schema and authentication debugging reproducible without modifying the remote database.

### Minimal Code Example

```env
TURSO_DATABASE_URL=http://127.0.0.1:8080
TURSO_AUTH_TOKEN=local-development-only
```

### Feature Domain(s)

- Database
- Infrastructure
- Development Workflow

### Index Tags

`#turso #local-development #libsql #sqlite #database #infrastructure`

---

### D021 - Use Turso Cloud for Current Development Testing

**Date**: 2026-08-23
**Status**: Active
**Overrides**: D020 for current development and testing

### Summary of Changes

Development and authentication testing currently target the configured Turso Cloud database through `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in `.env.local`. The persistent local Turso workflow described in D020 is deferred until a later date.

### Rationale

- Login testing must exercise the deployed cloud schema and seeded user data.
- Avoids confusing local database state with the database used by the running application.
- Keeps the local Turso workflow documented without making it the active setup requirement.

### Minimal Code Example

```env
TURSO_DATABASE_URL=libsql://score-tracker-sjingo.aws-eu-west-1.turso.io
TURSO_AUTH_TOKEN=<cloud-token>
```

### Feature Domain(s)

- Database
- Infrastructure
- Development Workflow
- Authentication

### Index Tags

`#turso #cloud-development #authentication #testing #infrastructure`

---

### D022 - Minimize Authentication Dependencies

**Date**: 2026-08-23  
**Status**: Superseded by D023  
**Architectural Decision**: Yes

### Summary of Changes

Authentication and session management should use packages and platform capabilities already present in the project whenever they meet the security and runtime requirements. Do not add a new authentication, session, or database package without a demonstrated need.

The current custom authentication flow retains the already-installed `jose` package for signing and verifying session tokens. No additional package is required for the session-cookie implementation.

### Rationale

- Reduces dependency count, upgrade surface, bundle impact, and maintenance overhead.
- Avoids introducing a second authentication abstraction when the project already uses custom bcrypt authentication.
- `jose` provides standard JWT signing, verification, and expiry handling and is already installed.
- Native Node.js and Next.js APIs remain preferred for supporting tasks such as cookies, request handling, and database access.
- A new dependency may be adopted later only when it provides a clear benefit that existing tools cannot provide safely or practically.

### Minimal Code Example

```typescript
import { SignJWT, jwtVerify } from "jose";

const token = await new SignJWT({ user })
  .setProtectedHeader({ alg: "HS256" })
  .setExpirationTime("7d")
  .sign(secret);
```

### Feature Domain(s)

- Architecture
- Authentication
- Security
- Infrastructure

### Index Tags

`#architecture #dependencies #auth #security #jose #simplicity`

---

### D023 - Adopt Better Auth with Turso via Kysely

**Date**: 2026-08-23  
**Status**: Active  
**Overrides**: D018, D019, and D022 for authentication implementation  
**Architectural Decision**: Yes

### Summary of Changes

Authentication now uses Better Auth for email/password sign-in, sessions, cookies, and password hashing. Better Auth connects to the remote Turso Cloud database through Kysely and the `@libsql/kysely-libsql` dialect. The cloud database now contains Better Auth's `user`, `session`, `account`, and `verification` tables.

The legacy custom bcrypt/JWT routes and helpers are removed. The existing Lions domain tables remain unchanged.

### Rationale

- Better Auth provides the standard session, cookie, credential, and expiry lifecycle instead of maintaining those security-sensitive parts locally.
- The existing `@libsql/client` remains the database client for application domain queries and setup operations.
- The focused Kysely libSQL bridge is required because the installed Better Auth version does not provide a native `@libsql/client` adapter.
- The direct `bcrypt`, `jose`, and `better-sqlite3` dependencies were removed; the migration adds only the Kysely bridge and its direct Kysely peer.
- The cloud administrator was reseeded through Better Auth so its credential uses Better Auth's native scrypt format.

### Minimal Code Example

```typescript
export const auth = betterAuth({
  database: { db, type: "sqlite" },
  emailAndPassword: { enabled: true, disableSignUp: true },
});
```

### Feature Domain(s)

- Architecture
- Authentication
- Database
- Security
- Infrastructure

### Index Tags

`#architecture #better-auth #turso #kysely #sessions #scrypt #dependencies`

---

## Quick Reference Index

### By Domain

- **Database**: D001, D002, D004, D006, D009, D010, D011, D012, D013, D014, D015, D018, D019, D020, D021, D023
- **API**: D003, D006, D009, D012, D013, D015, D018, D019, D023
- **UI**: D005, D008, D009, D012, D015
- **Infrastructure**: D001, D002, D004, D011, D016, D018, D020, D021, D022, D023
- **Privacy**: D007, D016
- **Security**: D016, D023
- **Authentication**: D023
- **Architecture**: D006, D010, D023
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
- **Authentication**: D023
- **Dependency Management**: D022, D023
- **Local Development**: D020, D021
- **OAuth Integration**: D017 (superseded by D018)

### Active Decisions

`#active`: D001, D002, D003, D004, D005, D006, D007, D008, D009, D010, D011, D012, D013, D014, D015, D016, D021, D023
