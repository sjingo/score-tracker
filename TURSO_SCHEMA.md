# Turso Schema - Score Tracker App

## Overview

This document defines the Turso (libSQL) database structure for the Score Tracker application. Turso is an edge SQLite platform built on libSQL, providing distributed SQLite databases with sync and replication capabilities.

---

## Turso Database Setup

### Prerequisites

- Turso CLI installed
- Turso account and authentication token
- Next.js application configured with Turso client library

### Key Turso Features Used

- **Embedded Replicas**: Local read-only copies for edge performance
- **libSQL Protocol**: SQLite-compatible with network sync
- **JWT Authentication**: Secure API access
- **Multi-region**: Databases replicated across regions

### Environment Variables

```env
TURSO_CONNECTION_URL=libsql://your-database-name-your-org.turso.io
TURSO_AUTH_TOKEN=your_jwt_auth_token
```

---

## Database Tables

### 1. `teams` Table

Stores information about the team(s) using the application.

```sql
CREATE TABLE teams (
  id TEXT PRIMARY KEY,
  team_name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | Unique team identifier (UUID) |
| team_name | TEXT | NOT NULL | Name of the team |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Example Data**:

```
id: 'team_lions'
team_name: 'Lions'
created_at: '2026-01-15 10:30:00'
updated_at: '2026-08-19 14:22:00'
```

---

### 2. `players` Table

Stores player information. Players are manually added and always belong to the tenant team (Lions).

```sql
CREATE TABLE players (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  jersey_number INTEGER,
  anonymised_id TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | Unique player identifier |
| first_name | TEXT | NOT NULL | Player's first name |
| last_name | TEXT | NOT NULL | Player's last name |
| jersey_number | INTEGER | | Player's jersey number |
| anonymised_id | TEXT | | Anonymised identifier for privacy |
| is_active | BOOLEAN | DEFAULT 1 | Whether player is active |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes**:

```sql
CREATE INDEX idx_players_is_active ON players(is_active);
CREATE UNIQUE INDEX idx_players_anonymised_id ON players(anonymised_id);
CREATE INDEX idx_players_jersey ON players(jersey_number);
```

**Example Data**:

```
id: 'player_660e8400e29b41d4a716446655440001'
first_name: 'Jack'
last_name: 'Smith'
jersey_number: 7
anonymised_id: 'P001'
is_active: 1
created_at: '2026-01-20 10:00:00'
updated_at: '2026-08-19 14:22:00'
```

---

### 3. `game_types` Table

Stores available game type categories (static and custom).

```sql
CREATE TABLE game_types (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  type_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_deletable BOOLEAN DEFAULT 0,
  is_default BOOLEAN DEFAULT 0,
  color TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  UNIQUE(team_id, type_name)
);
```

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | Unique game type identifier |
| team_id | TEXT | NOT NULL, FK | Reference to parent team |
| type_name | TEXT | NOT NULL | Internal name (e.g., "league") |
| display_name | TEXT | NOT NULL | Display name for UI (e.g., "League") |
| is_deletable | BOOLEAN | DEFAULT 0 | Can this type be deleted |
| is_default | BOOLEAN | DEFAULT 0 | Is this a default type |
| color | TEXT | | Color code for UI display (#HEX) |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes**:

```sql
CREATE INDEX idx_game_types_team_id ON game_types(team_id);
CREATE UNIQUE INDEX idx_game_types_team_name ON game_types(team_id, type_name);
```

**Default Types** (inserted on team creation):

```sql
INSERT INTO game_types (id, team_id, type_name, display_name, is_deletable, is_default, color)
VALUES
  ('type_league_<teamId>', '<teamId>', 'league', 'League', 0, 1, '#3B82F6'),
  ('type_cup_<teamId>', '<teamId>', 'cup', 'Cup', 0, 1, '#EF4444'),
  ('type_friendly_<teamId>', '<teamId>', 'friendly', 'Friendly', 0, 1, '#10B981'),
  ('type_tournament_<teamId>', '<teamId>', 'tournament', 'Tournament', 0, 1, '#F59E0B');
```

---

### 4. `games` Table

Stores match records for each team.

```sql
CREATE TABLE games (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  opposition_name TEXT NOT NULL,
  game_type_id TEXT NOT NULL,
  tournament_name TEXT,
  score_for INTEGER DEFAULT 0,
  score_against INTEGER DEFAULT 0,
  match_date DATETIME NOT NULL,
  status TEXT DEFAULT 'in-progress',
  venue TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (game_type_id) REFERENCES game_types(id) ON DELETE RESTRICT
);
```

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | Unique game identifier |
| team_id | TEXT | NOT NULL, FK | Reference to parent team |
| opposition_name | TEXT | NOT NULL | Name of opponent |
| game_type_id | TEXT | NOT NULL, FK | Reference to game type |
| tournament_name | TEXT | | Optional tournament name |
| score_for | INTEGER | DEFAULT 0 | Goals scored by team |
| score_against | INTEGER | DEFAULT 0 | Goals conceded |
| match_date | DATETIME | NOT NULL | Date and time of match |
| status | TEXT | DEFAULT 'in-progress' | Game status (in-progress, completed, cancelled) |
| venue | TEXT | | Match location |
| notes | TEXT | | Optional match notes |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes**:

```sql
CREATE INDEX idx_games_team_id ON games(team_id);
CREATE INDEX idx_games_game_type_id ON games(game_type_id);
CREATE INDEX idx_games_team_match_date ON games(team_id, match_date DESC);
CREATE INDEX idx_games_team_type_date ON games(team_id, game_type_id, match_date DESC);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_opposition ON games(opposition_name);
```

**Example Data**:

```
id: 'game_770e8400e29b41d4a716446655440002'
team_id: 'team_550e8400e29b41d4a716446655440000'
opposition_name: 'Central United'
game_type_id: 'type_league_team_550e8400e29b41d4a716446655440000'
tournament_name: NULL
score_for: 3
score_against: 1
match_date: '2026-08-15 10:00:00'
status: 'completed'
venue: 'Central Park'
notes: 'Good team performance'
created_at: '2026-08-15 09:00:00'
updated_at: '2026-08-15 11:30:00'
```

**Business Rules**:

- ⚠️ **Update Constraint**: Games can **only be amended/updated** if their status is `'in-progress'`
- Once a game status changes to `'completed'` or `'cancelled'`, no further modifications to scores, scorers, or game details are allowed
- This ensures data integrity for finalized match records

---

### 5. `game_scorers` Table

Tracks which players scored in each game.

```sql
CREATE TABLE game_scorers (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  player_number INTEGER,
  goal_count INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE RESTRICT,
  UNIQUE(game_id, player_id)
);
```

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | Unique scorer record identifier |
| game_id | TEXT | NOT NULL, FK | Reference to game |
| player_id | TEXT | NOT NULL, FK | Reference to player |
| player_name | TEXT | NOT NULL | Denormalized player name |
| player_number | INTEGER | | Denormalized jersey number |
| goal_count | INTEGER | DEFAULT 1 | Number of goals scored |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Last update timestamp |

**Indexes**:

```sql
CREATE INDEX idx_game_scorers_game_id ON game_scorers(game_id);
CREATE INDEX idx_game_scorers_player_id ON game_scorers(player_id);
CREATE UNIQUE INDEX idx_game_scorers_unique ON game_scorers(game_id, player_id);
```

**Example Data**:

```
id: 'scorer_880e8400e29b41d4a716446655440003'
game_id: 'game_770e8400e29b41d4a716446655440002'
player_id: 'player_660e8400e29b41d4a716446655440001'
player_name: 'Jack Smith'
player_number: 7
goal_count: 2
created_at: '2026-08-15 10:15:00'
updated_at: '2026-08-15 11:20:00'
```

---

### 6. `season_stats` Table

Stores aggregated season statistics for reporting.

```sql
CREATE TABLE season_stats (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  season TEXT NOT NULL,
  total_games_played INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_draws INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  total_goals_for INTEGER DEFAULT 0,
  total_goals_against INTEGER DEFAULT 0,
  goal_difference INTEGER DEFAULT 0,
  top_scorer_id TEXT,
  top_scorer_name TEXT,
  top_scorer_goals INTEGER DEFAULT 0,
  last_updated DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (top_scorer_id) REFERENCES players(id) ON DELETE SET NULL,
  UNIQUE(team_id, season)
);
```

**Columns**:
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | Unique stat record identifier |
| team_id | TEXT | NOT NULL, FK | Reference to team |
| season | TEXT | NOT NULL | Season identifier (e.g., "2026-2027") |
| total_games_played | INTEGER | DEFAULT 0 | Total games played |
| total_wins | INTEGER | DEFAULT 0 | Number of wins |
| total_draws | INTEGER | DEFAULT 0 | Number of draws |
| total_losses | INTEGER | DEFAULT 0 | Number of losses |
| total_goals_for | INTEGER | DEFAULT 0 | Total goals scored |
| total_goals_against | INTEGER | DEFAULT 0 | Total goals conceded |
| goal_difference | INTEGER | DEFAULT 0 | Goal difference |
| top_scorer_id | TEXT | FK | Reference to top scorer player |
| top_scorer_name | TEXT | | Denormalized top scorer name |
| top_scorer_goals | INTEGER | DEFAULT 0 | Top scorer's goals |
| last_updated | DATETIME | | Last calculation timestamp |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |

**Indexes**:

```sql
CREATE INDEX idx_season_stats_team_id ON season_stats(team_id);
CREATE UNIQUE INDEX idx_season_stats_unique ON season_stats(team_id, season);
```

**Example Data**:

```
id: 'stat_990e8400e29b41d4a716446655440004'
team_id: 'team_550e8400e29b41d4a716446655440000'
season: '2026-2027'
total_games_played: 12
total_wins: 9
total_draws: 1
total_losses: 2
total_goals_for: 47
total_goals_against: 15
goal_difference: 32
top_scorer_id: 'player_660e8400e29b41d4a716446655440001'
top_scorer_name: 'Jack Smith'
top_scorer_goals: 15
last_updated: '2026-08-19 14:22:00'
created_at: '2026-01-01 00:00:00'
```

---

## Entity Relationship Diagram

```
┌─────────────────┐
│     teams       │
│─────────────────│
│ id (PK)         │
│ team_name       │
└─────────────────┘
        │
        │ (1:N)
        ├──────────────────┬─────────────────────┐
        │                  │                     │
        ▼                  ▼                     ▼
┌──────────────────┐ ┌─────────────────┐ ┌──────────────────┐
│   game_types     │ │     games       │ │ season_stats     │
│──────────────────│ │─────────────────│ │──────────────────│
│ id (PK)          │ │ id (PK)         │ │ id (PK)          │
│ team_id (FK)     │ │ team_id (FK)    │ │ team_id (FK)     │
│ type_name        │ │ opposition_name │ │ season           │
│ display_name     │ │ game_type_id(FK)│ │ total_games...   │
│ is_deletable      │ │ score_for       │ │ top_scorer_id(FK)│
│ is_default       │ │ score_against   │ │                  │
│ color            │ │ match_date      │ └──────────────────┘
└──────────────────┘ │ status          │
                     │ venue           │
                     └─────────────────┘
                             │
                             │ (1:N)
                             │
                             ▼
                     ┌─────────────────┐
                     │  game_scorers   │
                     │─────────────────│
                     │ id (PK)         │
                     │ game_id (FK)    │
                     │ player_id (FK)  │
                     │ goal_count      │
                     └─────────────────┘

┌─────────────────┐
│    players      │
│─────────────────│
│ id (PK)         │
│ first_name      │
│ last_name       │
│ jersey_number   │
│ anonymised_id   │
│ is_active       │
└─────────────────┘
```

---

## Turso-Specific Implementation

### Connection Setup (Node.js/Next.js)

```typescript
import { createClient } from "@libsql/client";

export const db = createClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});

// For edge functions (Vercel Edge, etc.) - sync client
import { createClient as createSyncClient } from "@libsql/client/web";

export const edgeDb = createSyncClient({
  url: process.env.TURSO_CONNECTION_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
```

### Example Queries using Turso Client

**Get all games for a team**:

```typescript
const games = await db.execute({
  sql: `SELECT * FROM games 
        WHERE team_id = ? 
        ORDER BY match_date DESC`,
  args: ["team123"],
});
```

**Insert a new game**:

```typescript
const result = await db.execute({
  sql: `INSERT INTO games 
        (id, team_id, opposition_name, game_type_id, score_for, score_against, match_date, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  args: [
    gameId,
    teamId,
    oppositionName,
    gameTypeId,
    scoreFor,
    scoreAgainst,
    matchDate,
    "completed",
  ],
});
```

**Update game with scores**:

```typescript
const result = await db.execute({
  sql: `UPDATE games 
        SET score_for = ?, score_against = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
  args: [scoreFor, scoreAgainst, gameId],
});
```

**Get top scorers**:

```typescript
const topScorers = await db.execute({
  sql: `SELECT 
          p.id, p.first_name, p.last_name, p.jersey_number,
          SUM(gs.goal_count) as total_goals
        FROM game_scorers gs
        JOIN players p ON gs.player_id = p.id
        JOIN games g ON gs.game_id = g.id
        WHERE g.team_id = ? AND g.match_date >= ? AND g.match_date <= ?
        GROUP BY p.id
        ORDER BY total_goals DESC
        LIMIT 10`,
  args: [teamId, seasonStart, seasonEnd],
});
```

**Batch insert scorers for a game**:

```typescript
const batch = scorers.map((scorer) => ({
  sql: `INSERT INTO game_scorers 
        (id, game_id, player_id, player_name, player_number, goal_count)
        VALUES (?, ?, ?, ?, ?, ?)`,
  args: [
    scorerId,
    gameId,
    scorer.playerId,
    scorer.playerName,
    scorer.playerNumber,
    scorer.goalCount,
  ],
}));

await db.batch(batch);
```

---

## Turso CLI Commands

### Database Management

```bash
# Create a new database
turso db create score-tracker

# List all databases
turso db list

# Get database connection details
turso db show score-tracker

# Delete a database
turso db destroy score-tracker

# Create a read replica
turso db replicate score-tracker --location fra

# Create a backup
turso db shell score-tracker < schema.sql
```

### Token & Authentication

```bash
# Generate an API token
turso auth tokens create

# Revoke a token
turso auth tokens revoke <token_id>

# List tokens
turso auth tokens list
```

### Database Shell

```bash
# Open interactive shell
turso db shell score-tracker

# Execute SQL file
turso db shell score-tracker < migrations/001_init.sql

# Execute single command
turso db shell score-tracker "SELECT COUNT(*) FROM games;"
```

---

## Migration & Initialization

### Database Schema Initialization

```sql
-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- Create teams table
CREATE TABLE teams (
  id TEXT PRIMARY KEY,
  team_name TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create game_types table
CREATE TABLE game_types (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  type_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  is_deletable BOOLEAN DEFAULT 0,
  is_default BOOLEAN DEFAULT 0,
  color TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  UNIQUE(team_id, type_name)
);

-- Create players table
CREATE TABLE players (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  jersey_number INTEGER,
  anonymised_id TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create games table
CREATE TABLE games (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  opposition_name TEXT NOT NULL,
  game_type_id TEXT NOT NULL,
  tournament_name TEXT,
  score_for INTEGER DEFAULT 0,
  score_against INTEGER DEFAULT 0,
  match_date DATETIME NOT NULL,
  status TEXT DEFAULT 'in-progress',
  venue TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (game_type_id) REFERENCES game_types(id) ON DELETE RESTRICT
);

-- Create game_scorers table
CREATE TABLE game_scorers (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  player_number INTEGER,
  goal_count INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE RESTRICT,
  UNIQUE(game_id, player_id)
);

-- Create season_stats table
CREATE TABLE season_stats (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  season TEXT NOT NULL,
  total_games_played INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_draws INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  total_goals_for INTEGER DEFAULT 0,
  total_goals_against INTEGER DEFAULT 0,
  goal_difference INTEGER DEFAULT 0,
  top_scorer_id TEXT,
  top_scorer_name TEXT,
  top_scorer_goals INTEGER DEFAULT 0,
  last_updated DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (top_scorer_id) REFERENCES players(id) ON DELETE SET NULL,
  UNIQUE(team_id, season)
);

-- Create indexes
CREATE INDEX idx_players_is_active ON players(is_active);
CREATE UNIQUE INDEX idx_players_anonymised_id ON players(anonymised_id);
CREATE INDEX idx_players_jersey ON players(jersey_number);
CREATE INDEX idx_game_types_team_id ON game_types(team_id);
CREATE UNIQUE INDEX idx_game_types_team_name ON game_types(team_id, type_name);
CREATE INDEX idx_games_team_id ON games(team_id);
CREATE INDEX idx_games_game_type_id ON games(game_type_id);
CREATE INDEX idx_games_team_match_date ON games(team_id, match_date DESC);
CREATE INDEX idx_games_team_type_date ON games(team_id, game_type_id, match_date DESC);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_opposition ON games(opposition_name);
CREATE INDEX idx_game_scorers_game_id ON game_scorers(game_id);
CREATE INDEX idx_game_scorers_player_id ON game_scorers(player_id);
CREATE UNIQUE INDEX idx_game_scorers_unique ON game_scorers(game_id, player_id);
CREATE INDEX idx_season_stats_team_id ON season_stats(team_id);
CREATE UNIQUE INDEX idx_season_stats_unique ON season_stats(team_id, season);
```

### Save as Migration File

```bash
# Save the above SQL as migrations/001_init.sql
# Apply migration:
turso db shell score-tracker < migrations/001_init.sql
```

---

## Performance Considerations for Turso

### Read Replicas for Scalability

```typescript
// Use read replicas for analytics queries
const analyticsDb = createClient({
  url: process.env.TURSO_REPLICA_URL, // Read-only replica
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Heavy analytics queries use replica
const stats = await analyticsDb.execute({
  sql: `SELECT game_type, COUNT(*) as count FROM games GROUP BY game_type`,
});
```

### Batch Operations

```typescript
// Batch operations are more efficient
const batch = Array.from({ length: 100 }, (_, i) => ({
  sql: "INSERT INTO players (id, team_id, first_name, last_name) VALUES (?, ?, ?, ?)",
  args: [`player_${i}`, teamId, `Player${i}`, `Last${i}`],
}));

await db.batch(batch);
```

### Connection Pooling

Turso handles connection pooling automatically. No manual configuration needed.

---

## Sync Considerations

### Live Score Updates During Match

```typescript
// Use setInterval for live updates
const updateScoreLive = async (
  gameId: string,
  scoreFor: number,
  scoreAgainst: number,
) => {
  await db.execute({
    sql: `UPDATE games 
          SET score_for = ?, score_against = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?`,
    args: [scoreFor, scoreAgainst, gameId],
  });
};

// Update every 30 seconds during match
const interval = setInterval(() => {
  updateScoreLive(gameId, currentScore.for, currentScore.against);
}, 30000);
```

### Conflict Resolution

For concurrent updates (multiple users adding scorers):

```typescript
// Use CONFLICT REPLACE for idempotent operations
const result = await db.execute({
  sql: `INSERT OR REPLACE INTO game_scorers 
        (game_id, player_id, player_name, player_number, goal_count)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(game_id, player_id) DO UPDATE SET
          goal_count = goal_count + 1,
          updated_at = CURRENT_TIMESTAMP`,
  args: [gameId, playerId, playerName, playerNumber, 1],
});
```

---

## Backup & Disaster Recovery

### Automated Backups

Turso provides automatic daily backups. Access them via:

```bash
turso db list-backups score-tracker
turso db restore score-tracker --backup <backup_id>
```

### Manual Backup Export

```bash
# Export to SQL file
turso db shell score-tracker ".dump" > backup_$(date +%Y%m%d).sql

# Export to JSON (for custom processing)
turso db shell score-tracker \
  "SELECT json_object('games', (SELECT json_group_array(json_object('id', id, 'opposition', opposition_name)) FROM games)) as data" \
  > backup.json
```

---

## Turso vs SQLite vs Firestore Comparison

| Feature                | Turso                | SQLite             | Firestore              |
| ---------------------- | -------------------- | ------------------ | ---------------------- |
| **Type**               | Distributed SQLite   | Single-file DB     | NoSQL Document DB      |
| **Scalability**        | High (edge replicas) | Low (file-based)   | Very High              |
| **Real-time Sync**     | libSQL sync          | Manual             | Built-in               |
| **Query Language**     | SQL                  | SQL                | NoSQL queries          |
| **Cost**               | Pay-per-write        | Free (self-hosted) | Pay-per-read/write     |
| **Edge Support**       | Yes                  | Limited            | Yes                    |
| **Offline Capability** | Embedded replicas    | Yes                | Yes (Firebase offline) |

---

## Notes

- **Turso is libSQL-compatible**: Uses SQLite syntax with network capabilities
- **Embedded Replicas**: Enable local-first applications with sync
- **Automatic Backups**: Daily backups included in Turso plans
- **Multi-region**: Deploy replicas in different regions for low latency
- **Cost Model**: Turso charges based on row writes, reads are generally free
- **Development vs Production**: Use Turso for production, SQLite for local development
- **Migration Path**: Easy migration between SQLite and Turso using SQL dumps
