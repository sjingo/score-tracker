import { createClient } from "@libsql/client";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";

// Load .env.local
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length > 0) {
      const value = valueParts.join("=").trim();
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.error(
    "Error: TURSO_DATABASE_URL and TURSO_AUTH_TOKEN environment variables must be set",
  );
  process.exit(1);
}

const db = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

async function setupDatabase() {
  try {
    console.log("🚀 Starting database setup for Score Tracker...\n");

    // Create all tables
    console.log("📋 Creating tables...");

    const createTablesSQL = `
      -- TEAMS TABLE
      CREATE TABLE IF NOT EXISTS teams (
        id TEXT PRIMARY KEY,
        team_name TEXT NOT NULL
      );

      -- PLAYERS TABLE
      CREATE TABLE IF NOT EXISTS players (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        jersey_number INTEGER CHECK (jersey_number IS NULL OR (jersey_number >= 1 AND jersey_number <= 99)),
        anonymised_id TEXT UNIQUE,
        is_active BOOLEAN DEFAULT 1
      );

      -- GAME_TYPES TABLE
      CREATE TABLE IF NOT EXISTS game_types (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL,
        type_name TEXT NOT NULL,
        display_name TEXT NOT NULL,
        is_deletable BOOLEAN DEFAULT 0,
        is_default BOOLEAN DEFAULT 0,
        color TEXT,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        UNIQUE(team_id, type_name)
      );

      -- GAMES TABLE
      CREATE TABLE IF NOT EXISTS games (
        id TEXT PRIMARY KEY,
        team_id TEXT NOT NULL,
        opposition_name TEXT NOT NULL,
        game_type_id TEXT NOT NULL,
        tournament_name TEXT,
        location TEXT CHECK (location IN ('home', 'away')),
        score_for INTEGER DEFAULT 0,
        score_against INTEGER DEFAULT 0,
        match_date TEXT NOT NULL,
        status TEXT DEFAULT 'in-progress',
        venue TEXT,
        notes TEXT,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        FOREIGN KEY (game_type_id) REFERENCES game_types(id) ON DELETE RESTRICT
      );

      -- GAME_SCORERS TABLE
      CREATE TABLE IF NOT EXISTS game_scorers (
        id TEXT PRIMARY KEY,
        game_id TEXT NOT NULL,
        player_id TEXT NOT NULL,
        player_name TEXT NOT NULL,
        player_number INTEGER,
        goal_count INTEGER DEFAULT 1,
        FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE RESTRICT,
        UNIQUE(game_id, player_id)
      );

      -- SEASON_STATS TABLE
      CREATE TABLE IF NOT EXISTS season_stats (
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
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        FOREIGN KEY (top_scorer_id) REFERENCES players(id) ON DELETE SET NULL,
        UNIQUE(team_id, season)
      );

      -- INDEXES
      CREATE INDEX IF NOT EXISTS idx_players_is_active ON players(is_active);
      CREATE INDEX IF NOT EXISTS idx_players_jersey ON players(jersey_number);
      CREATE INDEX IF NOT EXISTS idx_game_types_team_id ON game_types(team_id);
      CREATE INDEX IF NOT EXISTS idx_games_team_id ON games(team_id);
      CREATE INDEX IF NOT EXISTS idx_games_game_type_id ON games(game_type_id);
      CREATE INDEX IF NOT EXISTS idx_games_team_match_date ON games(team_id, match_date);
      CREATE INDEX IF NOT EXISTS idx_games_team_type_date ON games(team_id, game_type_id, match_date);
      CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
      CREATE INDEX IF NOT EXISTS idx_games_opposition ON games(opposition_name);
      CREATE INDEX IF NOT EXISTS idx_game_scorers_game_id ON game_scorers(game_id);
      CREATE INDEX IF NOT EXISTS idx_game_scorers_player_id ON game_scorers(player_id);
      CREATE INDEX IF NOT EXISTS idx_season_stats_team_id ON season_stats(team_id);
    `;

    // Execute each statement separately
    const statements = createTablesSQL
      .split(";")
      .filter((s) => s.trim().length > 0);

    for (const statement of statements) {
      await db.execute(statement.trim());
    }

    console.log("✅ All tables created successfully!\n");

    // Migration: Check if players table has old schema (first_name, last_name)
    // and migrate to new schema (single name field)
    console.log("🔄 Checking for schema migrations...");
    try {
      const playersSchemaCheck = await db.execute("PRAGMA table_info(players)");
      const columns = (playersSchemaCheck.rows as any[]).map((row) => row.name);

      if (columns.includes("first_name") && columns.includes("last_name")) {
        console.log(
          "⚠️  Migrating players table from old schema to new schema...",
        );

        // Create new players table with correct schema and validation
        await db.execute(`
          CREATE TABLE IF NOT EXISTS players_new (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            jersey_number INTEGER CHECK (jersey_number IS NULL OR (jersey_number >= 1 AND jersey_number <= 99)),
            anonymised_id TEXT UNIQUE,
            is_active BOOLEAN DEFAULT 1
          )
        `);

        // Copy data from old table, concatenating first_name and last_name
        await db.execute(`
          INSERT INTO players_new (id, name, jersey_number, anonymised_id, is_active)
          SELECT id, 
                 TRIM(first_name || ' ' || last_name) as name,
                 jersey_number,
                 anonymised_id,
                 is_active
          FROM players
        `);

        // Drop old table and rename new one
        await db.execute("DROP TABLE players");
        await db.execute("ALTER TABLE players_new RENAME TO players");

        console.log("✅ Players table migrated successfully!\n");
      } else if (!columns.includes("name")) {
        console.log("❌ Players table has unexpected schema. Cannot migrate.");
        process.exit(1);
      } else {
        console.log("✅ Players table schema is up-to-date!\n");
      }
    } catch (error) {
      console.error("⚠️  Could not check players table schema, proceeding...");
    }

    // Check if Lions team already exists
    const teamsResult = await db.execute(
      "SELECT id FROM teams WHERE team_name = 'Lions'",
    );
    let lionsTeamId: string;

    if (teamsResult.rows.length === 0) {
      // Create Lions team
      console.log("🦁 Creating Lions team...");
      lionsTeamId = randomUUID();
      await db.execute("INSERT INTO teams (id, team_name) VALUES (?, ?)", [
        lionsTeamId,
        "Lions",
      ]);
      console.log("✅ Lions team created!\n");
    } else {
      lionsTeamId = teamsResult.rows[0].id as string;
      console.log("✅ Lions team already exists!\n");
    }

    // Check if default game types already exist
    const gameTypesResult = await db.execute(
      "SELECT id FROM game_types WHERE team_id = ? AND is_default = 1",
      [lionsTeamId],
    );

    if (gameTypesResult.rows.length === 0) {
      // Seed default game types
      console.log("🎮 Creating default game types...");

      const gameTypes = [
        {
          type_name: "league",
          display_name: "League",
          color: "#3b82f6",
          is_default: true,
        },
        {
          type_name: "cup",
          display_name: "Cup",
          color: "#ef4444",
          is_default: true,
        },
        {
          type_name: "friendly",
          display_name: "Friendly",
          color: "#10b981",
          is_default: true,
        },
        {
          type_name: "tournament",
          display_name: "Tournament",
          color: "#f59e0b",
          is_default: true,
        },
      ];

      for (const gameType of gameTypes) {
        const gameTypeId = randomUUID();
        await db.execute(
          "INSERT INTO game_types (id, team_id, type_name, display_name, is_deletable, is_default, color) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            gameTypeId,
            lionsTeamId,
            gameType.type_name,
            gameType.display_name,
            0, // is_deletable
            gameType.is_default ? 1 : 0,
            gameType.color,
          ],
        );
      }

      console.log("✅ Default game types created!\n");
    } else {
      console.log("✅ Default game types already exist!\n");
    }

    // Check if initial players already exist
    const playersResult = await db.execute(
      "SELECT COUNT(*) as count FROM players",
    );
    const playerCount = (playersResult.rows[0] as any).count as number;

    if (playerCount === 0) {
      // Seed initial Lions roster
      console.log("👥 Seeding initial Lions roster...");

      const initialRoster = [
        { name: "Paddy Doonan-Riley", jerseyNumber: 7 },
        { name: "Ari Ingolfsson", jerseyNumber: 18 },
        { name: "Josh", jerseyNumber: null },
        { name: "Stanley", jerseyNumber: null },
        { name: "Franklin", jerseyNumber: null },
        { name: "Logan", jerseyNumber: null },
        { name: "Suli", jerseyNumber: null },
        { name: "Sulimain", jerseyNumber: null },
        { name: "Alex", jerseyNumber: null },
        { name: "Harry", jerseyNumber: null },
      ];

      for (const player of initialRoster) {
        const playerId = randomUUID();
        const anonymisedId = `lions_${
          player.jerseyNumber || randomUUID().slice(0, 8)
        }`;

        await db.execute(
          "INSERT INTO players (id, name, jersey_number, anonymised_id, is_active) VALUES (?, ?, ?, ?, ?)",
          [playerId, player.name, player.jerseyNumber, anonymisedId, 1],
        );
      }

      console.log("✅ Initial Lions roster seeded!\n");
    } else {
      console.log("✅ Lions roster already exists!\n");
    }

    console.log("🎉 Database setup completed successfully!");
    console.log("\nYou can now:");
    console.log("1. Run 'npm run dev' to start the development server");
    console.log("2. Create API routes to interact with the database");
    console.log("3. Build UI components to display and manage data");
  } catch (error) {
    console.error("❌ Error setting up database:", error);
    process.exit(1);
  }
}

setupDatabase();
