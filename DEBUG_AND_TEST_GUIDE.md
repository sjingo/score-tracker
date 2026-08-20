# Lions Score Tracker - Debug & Test Guide

## Overview

This guide provides instructions for testing Phase 2 APIs (Games CRUD & Score Tracking) using debug pages and console logging.

**Key Concept**: All API routes include comprehensive console logging at both server (Node.js) and client (browser) levels. Debug pages render database table contents for easy visualization.

---

## Quick Start: View Your Console Logs

### 1. Server-Side Logs (Terminal)

```bash
# In your terminal, run:
npm run dev

# Watch the terminal as you use the app
# You'll see logs like:
# [GamesRoute] POST Creating new game for Lions team
# [ScoresRoute] POST Recording goal for game: game-uuid-123
```

### 2. Browser Console Logs (DevTools)

```
1. Open your browser: http://localhost:3000
2. Press F12 (or Ctrl+Shift+I)
3. Click the "Console" tab
4. You'll see logs like:
   [GamesView] Fetching initial data...
   [GamesView] Games: [...]
```

### 3. Recommended Setup

- **Split your screen**: Terminal on left, browser on right
- **Keep both visible** while testing
- **Watch logs update in real-time** as you interact with the app

---

## Getting Started

### Prerequisites

1. **Database initialized**: Run `npm run setup:db` (idempotent, safe to re-run)
2. **Development server running**: `npm run dev`
3. **Browser DevTools open**: F12 or Ctrl+Shift+I
4. **Terminal visible**: Watch for server-side logs during API calls

### Environment

- Frontend runs on: `http://localhost:3000`
- All API routes logged to: browser console + server terminal
- Debug endpoints available at: `http://localhost:3000/debug`

---

## Debug Pages & Endpoints

### 1. Main Debug Dashboard

**URL**: `http://localhost:3000/debug`

**What it shows:**

- Live table views of all 6 database tables
- Player list with anonymised IDs
- Games with game type details
- Game scorers with player snapshots
- Season stats (initially empty)
- Team info

**How to use:**

1. Navigate to `http://localhost:3000/debug`
2. Scroll through each table section
3. Watch the table update in real-time after creating/updating records
4. Open browser console (F12) to see detailed fetch logs

**Expected Initial State:**

- 1 team: "Lions"
- 10 players: Paddy, Ari, Josh, Stanley, Franklin, Logan, Suli, Sulimain, Alex, Harry
- 4 game types: League, Cup, Friendly, Tournament
- 0 games
- 0 game scorers
- 0 season stats

---

### 2. API Debug Endpoint

**URL**: `http://localhost:3000/api/debug`

**What it does:**

- Returns raw JSON of all 6 tables
- Useful for verifying data structure
- Response includes counts and sample records

**Sample Response:**

```json
{
  "success": true,
  "summary": {
    "teams_count": 1,
    "players_count": 10,
    "game_types_count": 4,
    "games_count": 0,
    "game_scorers_count": 0,
    "season_stats_count": 0
  },
  "data": {
    "teams": [...],
    "players": [...],
    "game_types": [...],
    "games": [...],
    "game_scorers": [...],
    "season_stats": [...]
  }
}
```

**How to use:**

1. Open `http://localhost:3000/api/debug` in browser
2. Use browser's JSON viewer or save as file
3. Compare data before/after operations
4. Check foreign key integrity

---

## Console Logging Architecture

### Server-Side Logs (Terminal)

**Location**: Terminal running `npm run dev`

**Pattern**: `[EndpointName] [Action] Message`

**Examples:**

```
[GamesRoute] POST Creating new game for Lions team
[GamesRoute] Validation opposition_name: "City FC" ✓
[GamesRoute] Validation game_type_id: "league-uuid" ✓
[GamesRoute] Inserted game: game-uuid-123
[GamesRoute] Returning game with type details

[ScoresRoute] POST Recording 2 goals for player paddy-uuid
[ScoresRoute] Player is_active: 1 ✓
[ScoresRoute] Inserted scorer, updating game.score_for
[ScoresRoute] Updated games.score_for: 0 → 2
```

### Client-Side Logs (Browser Console)

**Location**: F12 → Console tab in browser

**Pattern**: `[ComponentName] [Action] Message`

**Examples:**

```
[GamesView] Fetching initial data...
[GamesView] Games: [...]
[GamesView] Players: [...]
[GamesView] Game Types: [...]

[GamesView] Creating game: { opposition_name: "City FC", ... }
[GamesView] Game created: { id: "...", score_for: 0, ... }

[GamesView] Recording goal for player paddy-uuid
[GamesView] Goal recorded, updated game: { score_for: 2 }
```

---

## Test Scenarios

### Scenario 1: Create a Game

**Steps:**

1. Navigate to `http://localhost:3000` (main dashboard, Games tab)
2. Open browser console (F12)
3. Fill in Create Game form:
   - Opposition Name: "City FC"
   - Game Type: "League"
   - Location: "Home"
   - Venue: "Home Park"
   - Match Date: (today's date)
4. Click "Create Game"

**Expected Console Output (Browser):**

```
[GamesView] Creating game: {
  opposition_name: "City FC",
  game_type_id: "league-uuid",
  location: "home",
  venue: "Home Park",
  match_date: "2026-08-20"
}
[GamesView] Game created successfully: { id: "game-uuid-123", ... }
```

**Expected Console Output (Server Terminal):**

```
[GamesRoute] POST Creating new game for Lions team
[GamesRoute] Validation opposition_name: "City FC" ✓
[GamesRoute] Validation game_type_id: exists ✓
[GamesRoute] Location: home ✓
[GamesRoute] Inserted game: game-uuid-123
[GamesRoute] Returning game with type details
```

**Expected Result:**

- Game appears in "All Games" section
- Score displays as 0-0
- Game type shows as "League" with correct color
- Can see game in debug page under "Games Table"

---

### Scenario 2: Record a Goal

**Prerequisites**: Must have a game created (Scenario 1)

**Steps:**

1. In GamesView, click on the game created in Scenario 1
2. Select "Record Goal" section
3. Choose player from dropdown (e.g., "Paddy Doonan-Riley")
4. Enter goal count: 1
5. Click "Add Scorer"

**Expected Console Output (Browser):**

```
[GamesView] Recording goal for player: paddy-uuid (Paddy Doonan-Riley)
[GamesView] Goal count: 1
[GamesView] Response: { id: "game-uuid-123", score_for: 1, ... }
[GamesView] Game updated, scorers: [{ name: "Paddy...", goal_count: 1 }]
```

**Expected Console Output (Server Terminal):**

```
[ScoresRoute] POST Recording goal for game: game-uuid-123
[ScoresRoute] Player validation: paddy-uuid is_active=1 ✓
[ScoresRoute] Goal count: 1
[ScoresRoute] Inserted into game_scorers
[ScoresRoute] Updated games.score_for: 0 → 1
[ScoresRoute] Returning updated game with scorers
```

**Expected Result:**

- Game score updates to 1-0
- Scorers section shows "Paddy Doonan-Riley: 1 goal"
- Score count is correct
- Can verify in debug page

---

### Scenario 3: Record Multiple Goals (Same Player)

**Prerequisites**: Game with one goal from Paddy (Scenario 2)

**Steps:**

1. Select the same game
2. Record another goal for "Paddy Doonan-Riley", goal count: 2
3. Click "Update Scorer"

**Expected Console Output:**

```
[GamesView] Updating scorer for player: paddy-uuid
[GamesView] Old goal count: 1, New goal count: 2, Delta: +1
[GamesView] Response: { score_for: 2, ... }
```

**Expected Result:**

- Score updates to 2-0
- Paddy's total shows as 2 goals
- Game scorers list recalculates correctly

---

### Scenario 4: Record Goals for Multiple Players

**Prerequisites**: Game with 2 goals from Paddy

**Steps:**

1. Select the game
2. Record goal for "Ari Ingolfsson", goal count: 1
3. Verify score and scorers list

**Expected Result:**

- Score updates to 3-0
- Scorers list shows:
  - Paddy: 2 goals
  - Ari: 1 goal
- Total score_for = 3
- Scorers ordered by goal_count DESC (Paddy first)

---

### Scenario 5: Delete a Scorer

**Prerequisites**: Game with multiple scorers

**Steps:**

1. In game scorers section, click "Remove" on Ari's scorer entry
2. Confirm deletion

**Expected Result:**

- Ari removed from scorers list
- Score decrements from 3-0 to 2-0
- Only Paddy (2 goals) remains

---

### Scenario 6: Mark Game as Completed

**Steps:**

1. Locate a game in the Games list
2. Click "Mark Completed"

**Expected Result:**

- Game status changes from "in-progress" to "completed"
- Visual indicator (color or badge) shows status
- Cannot add new scorers (API prevents POST on completed games)

**Expected Console Output:**

```
[GamesRoute] PATCH Updating game status
[GamesRoute] Status updated: in-progress → completed
```

---

### Scenario 7: Verify Console Logs Match Database State

**Steps:**

1. Create a game with opposition "City United", game type "Cup", location "away"
2. Record 3 goals: Paddy (2), Josh (1)
3. Mark game completed
4. Navigate to `/api/debug`
5. Verify JSON response matches browser console logs

**Expected Verification:**

- `games` table: 1+ games with correct opposition_name, status="completed", location="away"
- `game_scorers` table: 2 entries (Paddy & Josh) with goal_counts
- Game's score_for = 3 (sum of goal counts)
- Browser console logs match server terminal logs

---

## Debugging Common Issues

### Issue 1: Console Shows No Logs

**Diagnosis**: Check if console logging is active in API routes.

**Fix**:

1. Ensure API routes have `console.log()` statements
2. Check browser console filter (filter "Verbose" or no filter)
3. Check that fetch requests are actually hitting the API (Network tab)

**Verification**:

```javascript
// Browser console
await fetch("/api/players")
  .then((r) => r.json())
  .then((d) => console.log(d));
// Should show all players with console logs in server terminal
```

---

### Issue 2: Game Created But Doesn't Appear

**Diagnosis**: Check database insert vs. UI fetch.

**Debug Steps**:

1. Open `/api/debug`
2. Check if game appears in `data.games`
3. If yes: UI fetch may have failed → check browser console for fetch error
4. If no: Insert failed → check server terminal for SQL error

**Fix**:

```
Check server logs for error pattern:
[GamesRoute] ERROR: [specific error message]
```

---

### Issue 3: Score Not Updating on Goal Record

**Diagnosis**: Check if `games.score_for` was incremented.

**Debug Steps**:

1. Navigate to `/api/debug`
2. Find the game
3. Check `score_for` value matches expected sum of goal_counts in `game_scorers`
4. If mismatch: INSERT succeeded but UPDATE failed

**Example**:

```
Created game, score_for = 0
Recorded goal: goal_count = 1
Expected: score_for = 1
Actual: score_for = 0  ← Problem!

Fix: Check server logs for UPDATE error
```

---

### Issue 4: Inactive Player Still Appears

**Diagnosis**: API may not be filtering `is_active = 1`.

**Fix**:

1. Check `/api/players` response
2. All players should have `is_active: true`
3. If inactive player returned: add WHERE clause to API

**Expected**:

```json
{
  "data": [
    { "id": "...", "name": "Paddy", "is_active": true },
    { "id": "...", "name": "Ari", "is_active": true }
  ]
}
```

---

## Console Log Checklist

### Before Each Test

- [ ] Open browser DevTools (F12)
- [ ] Open Console tab
- [ ] Clear console (Ctrl+L or trash icon)
- [ ] Keep server terminal visible
- [ ] Refresh page to ensure fresh state

### After Each Operation

- [ ] ✅ Browser console shows "[ComponentName] [Action]" log
- [ ] ✅ Server terminal shows "[RouteName] [Method]" log
- [ ] ✅ No error messages in either console
- [ ] ✅ Data appears in UI within 1-2 seconds
- [ ] ✅ Debug page (`/api/debug`) reflects changes within 1-2 seconds

---

## Quick Reference: Expected Logs by Operation

| Operation          | Browser Log                         | Server Log                                |
| ------------------ | ----------------------------------- | ----------------------------------------- |
| Fetch initial data | `[GamesView] Games: [...]`          | (no direct log, implicit in route)        |
| Create game        | `[GamesView] Game created: {...}`   | `[GamesRoute] POST Inserted game:`        |
| Record goal        | `[GamesView] Goal recorded, score:` | `[ScoresRoute] POST Updated score_for:`   |
| Update scorer      | `[GamesView] Updating scorer:`      | `[ScoresRoute] PATCH Updated goal_count:` |
| Delete scorer      | `[GamesView] Removed scorer:`       | `[ScoresRoute] DELETE Updated score_for:` |
| Mark completed     | `[GamesView] Status updated:`       | `[GamesRoute] PATCH Status updated:`      |
| Fetch players      | `[PlayersView] Fetching...`         | (implicit in route)                       |
| Add player         | `[PlayersView] Player added:`       | `[PlayersRoute] POST Inserted player:`    |

---

## Test Sequence (Full Workflow)

**Duration**: ~10 minutes

### Phase 1: Setup (2 min)

1. Open `http://localhost:3000/debug`
2. Verify initial state (10 players, 4 game types, 0 games)
3. Open browser console (F12)

### Phase 2: Create Game (2 min)

1. Go to `http://localhost:3000` (Games tab)
2. Create game: "City FC", "League", "Home", "Home Park"
3. Verify in both console and debug page

### Phase 3: Record Scorers (3 min)

1. Record goal: Paddy (1 goal)
2. Record goal: Ari (2 goals)
3. Verify score = 3, scorers list correct

### Phase 4: Update & Delete (2 min)

1. Update Ari's goals: 2 → 3
2. Verify score updates to 4
3. Delete Paddy's scorer entry
4. Verify score = 3, only Ari remains

### Phase 5: Mark Complete (1 min)

1. Mark game as "completed"
2. Verify status change in UI and debug page

---

## Files with Logging

| File                                         | Log Pattern                                 |
| -------------------------------------------- | ------------------------------------------- |
| `src/app/api/games/route.ts`                 | `[GamesRoute]`                              |
| `src/app/api/games/[gameId]/route.ts`        | `[GameIdRoute]`                             |
| `src/app/api/games/[gameId]/scores/route.ts` | `[ScoresRoute]`                             |
| `src/components/GamesView.tsx`               | `[GamesView]`                               |
| `src/components/PlayersView.tsx`             | `[PlayersView]`                             |
| `src/app/api/debug/route.ts`                 | `[DebugRoute]`                              |
| `src/app/debug/page.tsx`                     | (client-side fetches logged in [DebugPage]) |

---

## Useful Browser Console Commands

```javascript
// Fetch all games
await fetch("/api/games")
  .then((r) => r.json())
  .then((d) => console.table(d.data));

// Fetch all players
await fetch("/api/players")
  .then((r) => r.json())
  .then((d) => console.table(d.data));

// Fetch debug dump (all tables)
await fetch("/api/debug")
  .then((r) => r.json())
  .then((d) => console.log(d));

// Check game with scores
const gId = "your-game-id";
await fetch(`/api/games/${gId}`)
  .then((r) => r.json())
  .then((d) => console.log(d.data));

// Check game scorers
const gId = "your-game-id";
await fetch(`/api/games/${gId}/scores`)
  .then((r) => r.json())
  .then((d) => console.table(d.data));
```

---

## Expected Behavior Summary

### Games CRUD

- ✅ POST creates game with all fields (location, venue, etc.)
- ✅ GET lists all games with game_type JOIN
- ✅ PATCH updates game fields (including location, status, opponent score)
- ✅ DELETE cascades to game_scorers via FK

### Score Tracking

- ✅ POST inserts scorer and auto-increments game.score_for
- ✅ GET lists scorers ordered by goal_count DESC
- ✅ PATCH updates goal count with delta calculation
- ✅ DELETE removes scorer and decrements game.score_for

### Validation

- ✅ Game type must exist & belong to Lions
- ✅ Player must exist & be active (is_active=1)
- ✅ Cannot record goals on non-existent games
- ✅ Location must be 'home' or 'away'
- ✅ Jersey number (1-99) or NULL only

### Data Integrity

- ✅ game.score_for = SUM(game_scorers.goal_count)
- ✅ Player names snapshot in game_scorers for history
- ✅ Cascade deletes maintain referential integrity
- ✅ Anonymised IDs unique per player

---

## Next Steps

After validating all test scenarios:

1. **Review console logs** for consistency and clarity
2. **Check database state** with `/api/debug`
3. **Verify UI reflects** all changes in real-time
4. **Move to Phase 3**: Statistics & Results (season_stats aggregation)

---

**Happy testing!** 🦁⚽
