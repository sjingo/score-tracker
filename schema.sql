-- Score Tracker App - Turso Database Schema

-- ==========================================================================
-- BETTER AUTH CORE TABLES
-- ==========================================================================

CREATE TABLE user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  emailVerified INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE session (
  id TEXT PRIMARY KEY,
  expiresAt TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  ipAddress TEXT,
  userAgent TEXT,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE account (
  id TEXT PRIMARY KEY,
  accountId TEXT NOT NULL,
  issuer TEXT NOT NULL,
  providerId TEXT NOT NULL,
  userId TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  accessToken TEXT,
  refreshToken TEXT,
  idToken TEXT,
  accessTokenExpiresAt TEXT,
  refreshTokenExpiresAt TEXT,
  scope TEXT,
  password TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  UNIQUE(issuer, accountId)
);

CREATE TABLE verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE INDEX idx_user_email ON user(email);
CREATE INDEX idx_session_userId ON session(userId);
CREATE INDEX idx_account_userId ON account(userId);
CREATE INDEX idx_verification_identifier ON verification(identifier);

-- ============================================================================
-- 1. TEAMS TABLE
-- ============================================================================

CREATE TABLE teams (
  id TEXT PRIMARY KEY,
  team_name TEXT NOT NULL
);

-- ============================================================================
-- 2. PLAYERS TABLE
-- ============================================================================

CREATE TABLE players (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  jersey_number INTEGER CHECK (jersey_number IS NULL OR (jersey_number >= 1 AND jersey_number <= 99)),
  anonymised_id TEXT UNIQUE,
  is_active BOOLEAN DEFAULT 1
);

-- ============================================================================
-- 3. GAME_TYPES TABLE
-- ============================================================================

CREATE TABLE game_types (
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

-- ============================================================================
-- 4. GAMES TABLE
-- ============================================================================

CREATE TABLE games (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  opposition_team_id TEXT,
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
  FOREIGN KEY (opposition_team_id) REFERENCES teams(id) ON DELETE RESTRICT,
  FOREIGN KEY (game_type_id) REFERENCES game_types(id) ON DELETE RESTRICT
);

-- ============================================================================
-- 5. GAME_SCORERS TABLE
-- ============================================================================

CREATE TABLE game_scorers (
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

-- ============================================================================
-- 6. GAME_SAVES TABLE
-- ============================================================================

CREATE TABLE game_saves (
  id TEXT PRIMARY KEY,
  game_id TEXT NOT NULL,
  player_id TEXT NOT NULL,
  player_name TEXT NOT NULL,
  player_number INTEGER,
  save_count INTEGER DEFAULT 1 NOT NULL CHECK (save_count >= 0),
  FOREIGN KEY (game_id) REFERENCES games(id) ON DELETE CASCADE,
  FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE RESTRICT
);

-- ============================================================================
-- 7. SEASON_STATS TABLE
-- ============================================================================

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
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
  FOREIGN KEY (top_scorer_id) REFERENCES players(id) ON DELETE SET NULL,
  UNIQUE(team_id, season)
);

-- ============================================================================
-- INDEXES (Turso-compatible - no DESC in index definitions)
-- ============================================================================

CREATE INDEX idx_players_is_active ON players(is_active);
CREATE INDEX idx_players_jersey ON players(jersey_number);
CREATE INDEX idx_game_types_team_id ON game_types(team_id);
CREATE INDEX idx_games_team_id ON games(team_id);
CREATE INDEX idx_games_opposition_team_id ON games(opposition_team_id);
CREATE INDEX idx_games_game_type_id ON games(game_type_id);
CREATE INDEX idx_games_team_match_date ON games(team_id, match_date);
CREATE INDEX idx_games_team_type_date ON games(team_id, game_type_id, match_date);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_opposition ON games(opposition_name);
CREATE INDEX idx_game_scorers_game_id ON game_scorers(game_id);
CREATE INDEX idx_game_scorers_player_id ON game_scorers(player_id);
CREATE INDEX idx_game_saves_game_id ON game_saves(game_id);
CREATE INDEX idx_game_saves_player_id ON game_saves(player_id);
CREATE INDEX idx_season_stats_team_id ON season_stats(team_id);
