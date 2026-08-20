# Score Tracker App

## Overview

A web application for recording and tracking football match statistics for an under-9 boys football team.

## Purpose

- Record scores from team matches
- Track which players scored in each game
- Categorize games by type (league, cup, friendly, tournament)
- Display comprehensive results and statistics in a league table format

---

## Key Features

### 1. Game Management

#### Recording a Game

Each new game entry includes:

- **Opposition Name**: The name of the team played against
- **Unique Game ID**: Auto-generated unique identifier for each game
- **Game Type**: Selected from an enumerated list:
  - **League** - League matches (cannot be deleted)
  - **Cup** - Cup competition matches (cannot be deleted)
  - **Friendly** - Friendly matches (cannot be deleted)
  - **Tournament** - Tournament matches with optional tournament name
    - If "Tournament" is selected, an optional name can be appended
    - Example: "Tournament: Spring Championship"

#### Dynamic Game Types

- New game types can be added by users at any time
- New types are instantly accessible from the select menu to prevent duplicates
- Default types (League, Cup, Friendly) cannot be deleted from the database
- Custom types can be modified or removed as needed

### 2. Live Score Tracking

#### Score Entry

- **Scores For**: Record goals scored by the team (entered live during the game)
- **Scores Against**: Record goals conceded (entered live during the game)
- Scores can be updated in real-time as the match progresses

#### Player Scorers

- Select scorers from the players table
- Players are stored in a dedicated players database
- Multiple goals by the same player can be recorded
- Supports anonymisation through player ID reference

---

## 3. Results & Statistics

### Results Page Features

#### Display Elements

- Game results and scores
- List of players who scored (scorers)
- Game type categorization

#### League Table Matrix

A comprehensive league table showing:

- **Wins** - Number of games won
- **Losses** - Number of games lost
- **Draws** - Number of games drawn
- **For (F)** - Total goals scored by the team
- **Against (A)** - Total goals conceded by the team
- **Difference (D)** - Goal difference (For - Against)
- **Scorers** - Top scorers and their goal tallies

#### Filtering & Sorting

- Sort and filter results by game type
- View separate tables for League, Cup, Friendly, and Tournament matches
- Quick statistics and analysis

---

## Database Tables

### Games Table

- game_id (unique identifier)
- opposition_name (string)
- game_type (enum/foreign key)
- score_for (integer)
- score_against (integer)
- created_at (timestamp)

### Players Table

- player_id (unique identifier)
- player_name (string)
- player_number (integer)
- anonymised_id (optional, for privacy)

### Game Types Table

- type_id (unique identifier)
- type_name (string - League, Cup, Friendly, Tournament, or custom)
- is_deletable (boolean - false for default types)
- tournament_name (optional - for tournament type)

### Game Scorers Table

- id (unique identifier)
- game_id (foreign key)
- player_id (foreign key)
- goals_count (integer)

---

## User Workflow

### Creating a Match Record

1. Enter the opposition team name
2. Select a game type from the dropdown menu
3. If "Tournament" is selected, optionally add the tournament name
4. During the match, update scores for and against in real-time
5. Select each player who scores from the players list
6. Record goal counts for each player
7. Save the game record

### Viewing Results

1. Navigate to the Results page
2. Filter by game type if desired
3. View the league table with comprehensive statistics
4. Review individual match results and scorers
5. Analyze team performance

---

## Technical Stack

- **Framework**: Next.js
- **Authentication**: NextAuth
- **Hosting**: Vercel
- **Persistence**: IndexDB (initial implementation)
- **Database**: (To be configured for backend)
