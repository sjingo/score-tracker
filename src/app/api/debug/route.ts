import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// ============================================================================
// GET all data from all tables (for debugging/console viewing)
// ============================================================================

export async function GET() {
  console.log("[GET /api/debug] Fetching all data from all tables");

  try {
    // Fetch all tables
    const [teams, players, gameTypes, games, gameScorers, seasonStats] =
      await Promise.all([
        db.execute("SELECT * FROM teams ORDER BY team_name"),
        db.execute("SELECT * FROM players ORDER BY name"),
        db.execute("SELECT * FROM game_types ORDER BY display_name"),
        db.execute(
          `SELECT g.*, gt.display_name as game_type_display, gt.color as game_type_color
           FROM games g
           LEFT JOIN game_types gt ON g.game_type_id = gt.id
           ORDER BY g.match_date DESC`,
        ),
        db.execute(
          `SELECT gs.*, p.name as player_full_name, p.anonymised_id
           FROM game_scorers gs
           LEFT JOIN players p ON gs.player_id = p.id
           ORDER BY gs.game_id, gs.goal_count DESC`,
        ),
        db.execute("SELECT * FROM season_stats ORDER BY season DESC"),
      ]);

    const debugData = {
      timestamp: new Date().toISOString(),
      summary: {
        teams: teams.rows.length,
        players: players.rows.length,
        gameTypes: gameTypes.rows.length,
        games: games.rows.length,
        gameScorers: gameScorers.rows.length,
        seasonStats: seasonStats.rows.length,
      },
      tables: {
        teams: teams.rows,
        players: players.rows,
        gameTypes: gameTypes.rows,
        games: games.rows,
        gameScorers: gameScorers.rows,
        seasonStats: seasonStats.rows,
      },
    };

    console.log(
      "[GET /api/debug] Debug data:",
      JSON.stringify(debugData, null, 2),
    );

    return NextResponse.json({
      success: true,
      data: debugData,
    });
  } catch (error) {
    console.error("[GET /api/debug] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch debug data" },
      { status: 500 },
    );
  }
}
