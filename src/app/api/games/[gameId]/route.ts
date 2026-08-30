import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { InValue } from "@libsql/client";

// ============================================================================
// GET specific game with scorers
// ============================================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params;
  console.log(`[GET /api/games/:gameId] Fetching game: ${gameId}`);

  try {
    // Fetch game with game_type
    const gameResult = await db.execute(
      `SELECT g.*, gt.display_name as game_type_display, gt.color as game_type_color
       FROM games g
       JOIN game_types gt ON g.game_type_id = gt.id
       WHERE g.id = ?`,
      [gameId],
    );

    if (gameResult.rows.length === 0) {
      console.warn(`[GET /api/games/:gameId] Game not found: ${gameId}`);
      return NextResponse.json(
        { success: false, error: "Game not found" },
        { status: 404 },
      );
    }

    const game = gameResult.rows[0];

    // Fetch scorers with player details
    const scorersResult = await db.execute(
      `SELECT gs.*, p.name as player_name_full, p.anonymised_id, p.is_active
       FROM game_scorers gs
       LEFT JOIN players p ON gs.player_id = p.id
       WHERE gs.game_id = ?
       ORDER BY gs.goal_count DESC`,
      [gameId],
    );

    console.log(
      `[GET /api/games/:gameId] Game found with ${scorersResult.rows.length} scorers`,
    );

    return NextResponse.json({
      success: true,
      data: {
        ...game,
        scorers: scorersResult.rows,
      },
    });
  } catch (error) {
    console.error(`[GET /api/games/:gameId] Error:`, error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch game" },
      { status: 500 },
    );
  }
}

// ============================================================================
// PATCH update game (opponent score, notes, status)
// ============================================================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params;
  console.log(`[PATCH /api/games/:gameId] Updating game: ${gameId}`);

  try {
    const body = await request.json();
    console.log("[PATCH /api/games/:gameId] Request body:", body);

    const { status, scoreAgainst, notes, venue, oppositionName, location } =
      body;

    // Check game exists
    const gameCheckResult = await db.execute(
      "SELECT id, status FROM games WHERE id = ?",
      [gameId],
    );

    if (gameCheckResult.rows.length === 0) {
      console.warn(`[PATCH /api/games/:gameId] Game not found: ${gameId}`);
      return NextResponse.json(
        { success: false, error: "Game not found" },
        { status: 404 },
      );
    }

    // Build update query dynamically
    const updates: string[] = [];
    const values: InValue[] = [];

    if (status !== undefined) {
      updates.push("status = ?");
      values.push(status);
      console.log(`[PATCH /api/games/:gameId] Updating status to: ${status}`);
    }

    if (scoreAgainst !== undefined) {
      if (scoreAgainst < 0) {
        console.warn(
          `[PATCH /api/games/:gameId] Invalid scoreAgainst: ${scoreAgainst}`,
        );
        return NextResponse.json(
          { success: false, error: "Score cannot be negative" },
          { status: 400 },
        );
      }
      updates.push("score_against = ?");
      values.push(scoreAgainst);
      console.log(
        `[PATCH /api/games/:gameId] Updating score_against to: ${scoreAgainst}`,
      );
    }

    if (notes !== undefined) {
      updates.push("notes = ?");
      values.push(notes);
      console.log(`[PATCH /api/games/:gameId] Updating notes`);
    }

    if (venue !== undefined) {
      updates.push("venue = ?");
      values.push(venue);
      console.log(`[PATCH /api/games/:gameId] Updating venue to: ${venue}`);
    }

    if (oppositionName !== undefined) {
      updates.push("opposition_name = ?");
      values.push(oppositionName);
      console.log(
        `[PATCH /api/games/:gameId] Updating opposition_name to: ${oppositionName}`,
      );
    }

    if (location !== undefined) {
      if (location && !["home", "away"].includes(location)) {
        console.warn(
          `[PATCH /api/games/:gameId] Invalid location: ${location}`,
        );
        return NextResponse.json(
          { success: false, error: "Location must be 'home' or 'away'" },
          { status: 400 },
        );
      }
      updates.push("location = ?");
      values.push(location || null);
      console.log(
        `[PATCH /api/games/:gameId] Updating location to: ${location}`,
      );
    }

    if (updates.length === 0) {
      console.warn(`[PATCH /api/games/:gameId] No fields to update`);
      return NextResponse.json(
        { success: false, error: "No fields to update" },
        { status: 400 },
      );
    }

    updates.push("id = ?");
    values.push(gameId);

    const query = `UPDATE games SET ${updates.join(", ")} WHERE id = ?`;
    // await db.execute(query, values);
    await db.execute({
      sql: query,
      args: [...values, gameId],
    });

    console.log(`[PATCH /api/games/:gameId] Game updated successfully`);

    // Fetch and return updated game
    const updatedResult = await db.execute(
      `SELECT g.*, gt.display_name as game_type_display, gt.color as game_type_color
       FROM games g
       JOIN game_types gt ON g.game_type_id = gt.id
       WHERE g.id = ?`,
      [gameId],
    );

    return NextResponse.json({
      success: true,
      data: updatedResult.rows[0],
    });
  } catch (error) {
    console.error("[PATCH /api/games/:gameId] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update game" },
      { status: 500 },
    );
  }
}

// ============================================================================
// DELETE game
// ============================================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params;
  console.log(`[DELETE /api/games/:gameId] Deleting game: ${gameId}`);

  try {
    // Check game exists
    const gameCheckResult = await db.execute(
      "SELECT id, opposition_name FROM games WHERE id = ?",
      [gameId],
    );

    if (gameCheckResult.rows.length === 0) {
      console.warn(`[DELETE /api/games/:gameId] Game not found: ${gameId}`);
      return NextResponse.json(
        { success: false, error: "Game not found" },
        { status: 404 },
      );
    }

    const deletedGame = gameCheckResult.rows[0];

    // Delete game (cascading delete via FK will remove game_scorers)
    await db.execute("DELETE FROM games WHERE id = ?", [gameId]);

    console.log(
      `[DELETE /api/games/:gameId] Game deleted successfully: ${deletedGame.opposition_name}`,
    );

    return NextResponse.json({
      success: true,
      message: `Game vs ${deletedGame.opposition_name} deleted`,
    });
  } catch (error) {
    console.error("[DELETE /api/games/:gameId] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete game" },
      { status: 500 },
    );
  }
}
