import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";

// ============================================================================
// GET assists for a specific game
// ============================================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params;
  console.log(
    `[GET /api/games/:gameId/assists] Fetching assists for game: ${gameId}`,
  );

  try {
    // Fetch game to verify it exists
    const gameResult = await db.execute(
      "SELECT id, status FROM games WHERE id = ?",
      [gameId],
    );

    if (gameResult.rows.length === 0) {
      console.warn(
        `[GET /api/games/:gameId/assists] Game not found: ${gameId}`,
      );
      return NextResponse.json(
        { success: false, error: "Game not found" },
        { status: 404 },
      );
    }

    // Fetch assists ordered by assist count
    const assistsResult = await db.execute(
      `SELECT ga.*, p.name as player_name_full, p.anonymised_id, p.is_active
       FROM game_assists ga
       LEFT JOIN players p ON ga.player_id = p.id
       WHERE ga.game_id = ?
       ORDER BY ga.assist_count DESC, ga.player_name ASC`,
      [gameId],
    );

    console.log(
      `[GET /api/games/:gameId/assists] Retrieved ${assistsResult.rows.length} assists`,
    );

    return NextResponse.json({
      success: true,
      data: assistsResult.rows,
    });
  } catch (error) {
    console.error("[GET /api/games/:gameId/assists] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch assists" },
      { status: 500 },
    );
  }
}

// ============================================================================
// POST record an assist for a player in a game
// ============================================================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params;
  console.log(
    `[POST /api/games/:gameId/assists] Recording assist for game: ${gameId}`,
  );

  try {
    const body = await request.json();
    const { playerId, playerNumber, assistCount = 1 } = body;

    console.log("[POST /api/games/:gameId/assists] Request body:", body);

    // Validation
    if (!playerId || !playerId.trim()) {
      console.warn("[POST /api/games/:gameId/assists] playerId is required");
      return NextResponse.json(
        { success: false, error: "Player ID is required" },
        { status: 400 },
      );
    }

    if (
      typeof assistCount !== "number" ||
      !Number.isInteger(assistCount) ||
      assistCount === 0
    ) {
      console.warn(
        `[POST /api/games/:gameId/assists] Invalid assistCount: ${assistCount}`,
      );
      return NextResponse.json(
        { success: false, error: "Assist count must be a non-zero integer" },
        { status: 400 },
      );
    }

    // Check game exists and is not completed
    const gameResult = await db.execute(
      "SELECT id, status FROM games WHERE id = ?",
      [gameId],
    );

    if (gameResult.rows.length === 0) {
      console.warn(
        `[POST /api/games/:gameId/assists] Game not found: ${gameId}`,
      );
      return NextResponse.json(
        { success: false, error: "Game not found" },
        { status: 404 },
      );
    }

    const game = gameResult.rows[0];

    if (game.status === "completed") {
      console.warn(
        `[POST /api/games/:gameId/assists] Cannot record assists on completed game: ${gameId}`,
      );
      return NextResponse.json(
        { success: false, error: "Cannot record assists on completed games" },
        { status: 409 },
      );
    }

    // Check player exists and is active
    const playerResult = await db.execute(
      "SELECT id, name, is_active FROM players WHERE id = ?",
      [playerId],
    );

    if (playerResult.rows.length === 0) {
      console.warn(
        `[POST /api/games/:gameId/assists] Player not found: ${playerId}`,
      );
      return NextResponse.json(
        { success: false, error: "Player not found" },
        { status: 404 },
      );
    }

    const player = playerResult.rows[0];

    if (!player.is_active) {
      console.warn(
        `[POST /api/games/:gameId/assists] Player is inactive: ${playerId} (${player.name})`,
      );
      return NextResponse.json(
        { success: false, error: "Cannot record assists for inactive players" },
        { status: 409 },
      );
    }

    console.log(
      `[POST /api/games/:gameId/assists] Player validated: ${player.name} (${playerId})`,
    );

    // Check if player already has assists in this game
    const existingResult = await db.execute(
      "SELECT id, assist_count FROM game_assists WHERE game_id = ? AND player_id = ?",
      [gameId, playerId],
    );

    const currentPlayerAssists =
      existingResult.rows.length > 0
        ? Number(existingResult.rows[0].assist_count)
        : 0;

    if (currentPlayerAssists + assistCount < 0) {
      console.warn(
        `[POST /api/games/:gameId/assists] Assist decrement would create a negative count`,
      );
      return NextResponse.json(
        {
          success: false,
          error: "Assists cannot be reduced below 0",
        },
        { status: 400 },
      );
    }

    let assistId: string;
    let newAssistCount: number;

    if (existingResult.rows.length > 0) {
      // Update existing assist entry
      const existing = existingResult.rows[0];
      assistId = existing.id as string;
      newAssistCount = (existing.assist_count as number) + assistCount;

      console.log(
        `[POST /api/games/:gameId/assists] Updating existing assist: ${existing.assist_count} -> ${newAssistCount}`,
      );

      await db.execute(
        "UPDATE game_assists SET assist_count = ? WHERE id = ?",
        [newAssistCount, assistId],
      );
    } else {
      // Create new assist entry
      assistId = randomUUID();
      newAssistCount = assistCount;

      console.log(
        `[POST /api/games/:gameId/assists] Creating new assist entry with ${assistCount} assist(s)`,
      );

      await db.execute(
        `INSERT INTO game_assists (id, game_id, player_id, player_name, player_number, assist_count)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          assistId,
          gameId,
          playerId,
          player.name,
          playerNumber || null,
          assistCount,
        ],
      );
    }

    console.log(
      `[POST /api/games/:gameId/assists] Assist recorded successfully`,
    );

    // Return updated assist with player details
    return NextResponse.json(
      {
        success: true,
        data: {
          id: assistId,
          game_id: gameId,
          player_id: playerId,
          player_name: player.name,
          player_number: playerNumber || null,
          assist_count: newAssistCount,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/games/:gameId/assists] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record assist" },
      { status: 500 },
    );
  }
}

// ============================================================================
// PATCH update assist count for a player in a game
// ============================================================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params;
  console.log(
    `[PATCH /api/games/:gameId/assists] Updating assist for game: ${gameId}`,
  );

  try {
    const body = await request.json();
    const { assistId, newAssistCount } = body;

    console.log("[PATCH /api/games/:gameId/assists] Request body:", body);

    if (!assistId) {
      console.warn("[PATCH /api/games/:gameId/assists] assistId is required");
      return NextResponse.json(
        { success: false, error: "Assist ID is required" },
        { status: 400 },
      );
    }

    if (newAssistCount < 0 || typeof newAssistCount !== "number") {
      console.warn(
        `[PATCH /api/games/:gameId/assists] Invalid newAssistCount: ${newAssistCount}`,
      );
      return NextResponse.json(
        { success: false, error: "Assist count must be >= 0" },
        { status: 400 },
      );
    }

    // Check game is not completed
    const gameResult = await db.execute(
      "SELECT status FROM games WHERE id = ?",
      [gameId],
    );

    if (gameResult.rows.length === 0) {
      console.warn(
        `[PATCH /api/games/:gameId/assists] Game not found: ${gameId}`,
      );
      return NextResponse.json(
        { success: false, error: "Game not found" },
        { status: 404 },
      );
    }

    if (gameResult.rows[0].status === "completed") {
      console.warn(
        `[PATCH /api/games/:gameId/assists] Cannot update completed game`,
      );
      return NextResponse.json(
        { success: false, error: "Cannot update assists on completed games" },
        { status: 409 },
      );
    }

    // Check assist exists
    const assistResult = await db.execute(
      "SELECT assist_count FROM game_assists WHERE id = ? AND game_id = ?",
      [assistId, gameId],
    );

    if (assistResult.rows.length === 0) {
      console.warn(
        `[PATCH /api/games/:gameId/assists] Assist not found: ${assistId}`,
      );
      return NextResponse.json(
        { success: false, error: "Assist not found" },
        { status: 404 },
      );
    }

    const oldAssistCount = assistResult.rows[0].assist_count as number;
    console.log(
      `[PATCH /api/games/:gameId/assists] Updating assists: ${oldAssistCount} -> ${newAssistCount}`,
    );

    if (newAssistCount === 0) {
      // Delete assist if count becomes 0
      console.log(
        `[PATCH /api/games/:gameId/assists] Deleting assist (assist count = 0)`,
      );
      await db.execute("DELETE FROM game_assists WHERE id = ?", [assistId]);
    } else {
      // Update assist count
      await db.execute(
        "UPDATE game_assists SET assist_count = ? WHERE id = ?",
        [newAssistCount, assistId],
      );
    }

    console.log(
      `[PATCH /api/games/:gameId/assists] Assist updated successfully`,
    );

    return NextResponse.json({
      success: true,
      data: {
        assistId,
        newAssistCount,
      },
    });
  } catch (error) {
    console.error("[PATCH /api/games/:gameId/assists] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update assist" },
      { status: 500 },
    );
  }
}

// ============================================================================
// DELETE remove an assist from a game
// ============================================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params;
  console.log(
    `[DELETE /api/games/:gameId/assists] Removing assist from game: ${gameId}`,
  );

  try {
    const body = await request.json();
    const { assistId } = body;

    console.log("[DELETE /api/games/:gameId/assists] Request body:", body);

    if (!assistId) {
      console.warn("[DELETE /api/games/:gameId/assists] assistId is required");
      return NextResponse.json(
        { success: false, error: "Assist ID is required" },
        { status: 400 },
      );
    }

    // Check game is not completed
    const gameResult = await db.execute(
      "SELECT status FROM games WHERE id = ?",
      [gameId],
    );

    if (gameResult.rows.length === 0) {
      console.warn(
        `[DELETE /api/games/:gameId/assists] Game not found: ${gameId}`,
      );
      return NextResponse.json(
        { success: false, error: "Game not found" },
        { status: 404 },
      );
    }

    if (gameResult.rows[0].status === "completed") {
      console.warn(
        `[DELETE /api/games/:gameId/assists] Cannot delete from completed game`,
      );
      return NextResponse.json(
        { success: false, error: "Cannot delete assists from completed games" },
        { status: 409 },
      );
    }

    // Check assist exists and get assist count
    const assistResult = await db.execute(
      "SELECT assist_count, player_name FROM game_assists WHERE id = ? AND game_id = ?",
      [assistId, gameId],
    );

    if (assistResult.rows.length === 0) {
      console.warn(
        `[DELETE /api/games/:gameId/assists] Assist not found: ${assistId}`,
      );
      return NextResponse.json(
        { success: false, error: "Assist not found" },
        { status: 404 },
      );
    }

    const deletedAssists = assistResult.rows[0].assist_count as number;
    const playerName = assistResult.rows[0].player_name;

    // Delete assist
    console.log(
      `[DELETE /api/games/:gameId/assists] Deleting assist: ${playerName} (${deletedAssists} assists)`,
    );

    await db.execute("DELETE FROM game_assists WHERE id = ?", [assistId]);

    console.log(
      `[DELETE /api/games/:gameId/assists] Assist deleted successfully`,
    );

    return NextResponse.json({
      success: true,
      message: `${playerName} removed from assists (${deletedAssists} assists deleted)`,
      data: {
        assistId,
      },
    });
  } catch (error) {
    console.error("[DELETE /api/games/:gameId/assists] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete assist" },
      { status: 500 },
    );
  }
}
