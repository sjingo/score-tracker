# Phase 2: Games & Score Tracking API - Implementation Guide

## Overview

Phase 2 adds complete Games Management and Score Tracking APIs with comprehensive console logging and debug capabilities.

## Features Implemented

### ✅ Complete Games CRUD

- **POST /api/games** - Create new game with full validation
- **GET /api/games** - List all games with scorers (auto-join)
- **GET /api/games/[gameId]** - Get single game with scorers
- **PATCH /api/games/[gameId]** - Update game (status, score_against, notes, venue)
- **DELETE /api/games/[gameId]** - Delete game (cascade delete scorers)

### ✅ Complete Score Tracking

- **POST /api/games/[gameId]/scores** - Record goal (auto-increment game score)
- **GET /api/games/[gameId]/scores** - List scorers for a game
- **PATCH /api/games/[gameId]/scores** - Update goal count (recalculates game score)
- **DELETE /api/games/[gameId]/scores** - Remove scorer (recalculates game score)

### ✅ Comprehensive Logging

All API routes include detailed console.log output with prefixes like:

- `[GET /api/games]`
- `[POST /api/games]`
- `[DELETE /api/games/:gameId/scores]`

Each log includes:

- Request data received
- Validation checks
- Database operations
- Error details
- Success confirmations

### ✅ Debug Features

- **/debug** page - Interactive table viewer
- **/api/debug** endpoint - Returns all database tables as JSON
- Auto-refresh every 5 seconds
- Collapsible table sections
- Summary statistics

## Console Logging Setup

All API routes automatically log to browser console (F12). No extra configuration needed.

### Example Console Output

```
[POST /api/games] Creating new game
[POST /api/games] Request body: {oppositionName: 'City FC', gameTypeId: '...', ...}
[POST /api/games] Lions team ID: 123abc
[POST /api/games] Game type validated: League
[POST /api/games] Match date: 2026-08-20
[POST /api/games] Generated game ID: def456
[POST /api/games] Game created successfully: def456
```

## Viewing Database Tables

### Option 1: Debug Web Page

1. Navigate to `http://localhost:3000/debug`
2. Click on table names to expand/collapse
3. View all tables with data
4. Auto-refreshes every 5 seconds

### Option 2: Debug API Endpoint

```bash
curl http://localhost:3000/api/debug | jq
```

Returns JSON structure:

```json
{
  "success": true,
  "data": {
    "timestamp": "2026-08-20T12:34:56.789Z",
    "summary": {
      "teams": 1,
      "players": 10,
      "gameTypes": 4,
      "games": 2,
      "gameScorers": 5,
      "seasonStats": 0
    },
    "tables": {
      "teams": [...],
      "players": [...],
      "gameTypes": [...],
      "games": [...],
      "gameScorers": [...],
      "seasonStats": [...]
    }
  }
}
```

### Option 3: Browser Console (F12)

1. Open DevTools (F12)
2. Go to Console tab
3. All API logs appear with timestamps
4. Click on log entries for details

## Games UI Features

### Create Game

1. Enter opposition name
2. Select game type
3. Optional: Add venue, notes
4. Auto-sets match_date to today if not provided
5. Auto-sets status to "in-progress"

### Record Goals

1. Select a game (in-progress only)
2. Choose player from dropdown
3. Enter number of goals (1-5)
4. Click "Add Goal"
5. Score automatically increments
6. Player must be active (is_active=1)

### View Scorers

- Listed under each game
- Shows player name and anonymised_id
- Displays goal count with badge
- Click "Remove" to delete scorer

### Update Game Status

- Click "Mark Complete" to finish game
- Cannot add/edit scores on completed games
- Completed games shown in separate section

## Validation Rules

### Games

- opposition_name: Required, non-empty
- gameTypeId: Required, must exist and belong to Lions
- matchDate: Optional (defaults to today)
- venue: Optional
- notes: Optional

### Scorers

- playerId: Required, must exist
- player must be active (is_active=1)
- goalCount: 1-5, must be positive integer
- Cannot record on completed games
- Cannot record on non-existent games

### Score Calculation

- score_for = SUM(goal_count) from game_scorers
- Automatically recalculated on every change
- Never manually editable

## Testing Checklist

### 1. Create Game

```
✅ Create game with opposition name + game type
✅ Game appears in list with today's date
✅ Scorers list shows empty
✅ Score shows 0-0
```

### 2. Record Goals

```
✅ Select player, enter goal count, click Add Goal
✅ Player appears in scorers list with goal count
✅ Game score_for auto-increments
✅ Console logs show "Goal recorded" messages
```

### 3. Multiple Scorers

```
✅ Add goal for Player A (1 goal)
✅ Add goal for Player B (2 goals)
✅ Verify score_for = 3
✅ Player B shows 2, Player A shows 1
```

### 4. Update Goal Count

```
✅ Add goal for Player C (1 goal)
✅ Click goal count badge to edit
✅ Change to 3 goals
✅ Verify score_for incremented by 2
```

### 5. Delete Scorer

```
✅ Click "Remove" on a scorer
✅ Scorer disappears from list
✅ score_for decrements correctly
✅ Console confirms deletion
```

### 6. Complete Game

```
✅ Create game, add scorers
✅ Click "Mark Complete"
✅ Game moves to Completed section
✅ Cannot add/edit scorers on completed game
```

### 7. Debug Console

```
✅ Navigate to /debug page
✅ All tables visible and expandable
✅ Game data matches UI
✅ Scorers table shows all entries
✅ Page auto-refreshes
```

## Common Issues & Debugging

### Issue: Goal not recording

**Check:**

- Is player selected?
- Is player active (check /debug)?
- Is game status "in-progress"?
- Check console for error message

### Issue: Score doesn't match scorers

**Run:** `curl http://localhost:3000/api/debug | jq '.data.tables.gameScorers'`

### Issue: Player inactive

**Check:** /debug → players table → is_active column
**Fix:** Players added via setup script are active by default

### Issue: API returning 404

**Check:** Game/Player IDs exist in debug console
**Verify:** Against Lions team (all games/players auto-filtered to Lions)

## Architecture Notes

### Single Tenant

- All operations auto-lookup Lions team
- No team selector in UI
- Easy to extend to multi-tenant later

### Opposition Teams

- Stored as plain text (no entity)
- Can have duplicates (teams play multiple times)
- No opponent records/history tracking

### Score Calculation

- score_for is **denormalized** (recalculated from sum)
- Prevents inconsistencies
- Single source of truth: game_scorers table

### Player Anonymisation

- anonymised*id = `lions*<jersey#>`or`lions\_<random8>`
- Displayed in UI for privacy
- Stored in game_scorers snapshot

## Performance Notes

- GET /api/games auto-joins game_types and enriches with scorers (all in parallel)
- Suitable for small squads (<20 players, <50 games)
- For large datasets, add pagination to GET endpoints

## Next Steps (Phase 3)

- Season Statistics aggregation
- Win/Draw/Loss calculation
- Top scorer tracking
- Results filtering by game type
- Export to CSV/PDF
- Admin authentication
