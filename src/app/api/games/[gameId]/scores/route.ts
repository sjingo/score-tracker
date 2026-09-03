import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";

// ============================================================================
// GET scores/scorers for a specific game
// ============================================================================
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params;
  console.log(
    `[GET /api/games/:gameId/scores] Fetching scorers for game: ${gameId}`,
  );

  try {
    // Fetch game to verify it exists
    const gameResult = await db().execute(
      "SELECT id, status FROM games WHERE id = ?",
      [gameId],
    );

    if (gameResult.rows.length === 0) {
      console.warn(`[GET /api/games/:gameId/scores] Game not found: ${gameId}`);
      return NextResponse.json(
        { success: false, error: "Game not found" },
        { status: 404 },
      );
    }

    // Fetch scorers ordered by goal count
    const scorersResult = await db().execute(
      `SELECT gs.*, p.name as player_name_full, p.anonymised_id, p.is_active
       FROM game_scorers gs
       LEFT JOIN players p ON gs.player_id = p.id
       WHERE gs.game_id = ?
       ORDER BY gs.goal_count DESC, gs.player_name ASC`,
      [gameId],
    );

    console.log(
      `[GET /api/games/:gameId/scores] Retrieved ${scorersResult.rows.length} scorers`,
    );

    return NextResponse.json({
      success: true,
      data: scorersResult.rows,
    });
  } catch (error) {
    console.error("[GET /api/games/:gameId/scores] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch scores" },
      { status: 500 },
    );
  }
}

// ============================================================================
// POST record a goal for a player in a game
// ============================================================================
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params;
  console.log(
    `[POST /api/games/:gameId/scores] Recording goal for game: ${gameId}`,
  );

  try {
    const body = await request.json();
    const { playerId, playerNumber, goalCount = 1 } = body;

    console.log("[POST /api/games/:gameId/scores] Request body:", body);

    // Validation
    if (!playerId || !playerId.trim()) {
      console.warn("[POST /api/games/:gameId/scores] playerId is required");
      return NextResponse.json(
        { success: false, error: "Player ID is required" },
        { status: 400 },
      );
    }

    if (
      typeof goalCount !== "number" ||
      !Number.isInteger(goalCount) ||
      goalCount === 0
    ) {
      console.warn(
        `[POST /api/games/:gameId/scores] Invalid goalCount: ${goalCount}`,
      );
      return NextResponse.json(
        { success: false, error: "Goal count must be a non-zero integer" },
        { status: 400 },
      );
    }

    // Check game exists and is not completed
    const gameResult = await db().execute(
      "SELECT id, status, opposition_name FROM games WHERE id = ?",
      [gameId],
    );

    if (gameResult.rows.length === 0) {
      console.warn(
        `[POST /api/games/:gameId/scores] Game not found: ${gameId}`,
      );
      return NextResponse.json(
        { success: false, error: "Game not found" },
        { status: 404 },
      );
    }

    const game = gameResult.rows[0];

    if (game.status === "completed") {
      console.warn(
        `[POST /api/games/:gameId/scores] Cannot record goals on completed game: ${gameId}`,
      );
      return NextResponse.json(
        { success: false, error: "Cannot record goals on completed games" },
        { status: 409 },
      );
    }

    // Check player exists and is active
    const playerResult = await db().execute(
      "SELECT id, name, is_active FROM players WHERE id = ?",
      [playerId],
    );

    if (playerResult.rows.length === 0) {
      console.warn(
        `[POST /api/games/:gameId/scores] Player not found: ${playerId}`,
      );
      return NextResponse.json(
        { success: false, error: "Player not found" },
        { status: 404 },
      );
    }

    const player = playerResult.rows[0];

    if (!player.is_active) {
      console.warn(
        `[POST /api/games/:gameId/scores] Player is inactive: ${playerId} (${player.name})`,
      );
      return NextResponse.json(
        { success: false, error: "Cannot record goals for inactive players" },
        { status: 409 },
      );
    }

    console.log(
      `[POST /api/games/:gameId/scores] Player validated: ${player.name} (${playerId})`,
    );

    // Check if player already has goals in this game
    const existingResult = await db().execute(
      "SELECT id, goal_count FROM game_scorers WHERE game_id = ? AND player_id = ?",
      [gameId, playerId],
    );

    const currentPlayerGoals =
      existingResult.rows.length > 0
        ? Number(existingResult.rows[0].goal_count)
        : 0;

    const currentTeamGoalsResult = await db().execute(
      "SELECT COALESCE(SUM(goal_count), 0) as total_goals FROM game_scorers WHERE game_id = ?",
      [gameId],
    );

    const currentTeamGoals = Number(
      currentTeamGoalsResult.rows[0].total_goals ?? 0,
    );

    if (
      currentPlayerGoals + goalCount < 0 ||
      currentTeamGoals + goalCount < 0
    ) {
      console.warn(
        `[POST /api/games/:gameId/scores] Goal decrement would create a negative score`,
      );
      return NextResponse.json(
        {
          success: false,
          error: "Goals cannot reduce a player or team below 0",
        },
        { status: 400 },
      );
    }

    let scorerId: string;
    let newGoalCount: number;

    if (existingResult.rows.length > 0) {
      // Update existing scorer entry
      const existing = existingResult.rows[0];
      scorerId = existing.id as string;
      newGoalCount = (existing.goal_count as number) + goalCount;

      console.log(
        `[POST /api/games/:gameId/scores] Updating existing scorer: ${existing.goal_count} -> ${newGoalCount}`,
      );

      await db().execute("UPDATE game_scorers SET goal_count = ? WHERE id = ?", [
        newGoalCount,
        scorerId,
      ]);
    } else {
      // Create new scorer entry
      scorerId = randomUUID();
      newGoalCount = goalCount;

      console.log(
        `[POST /api/games/:gameId/scores] Creating new scorer entry with ${goalCount} goal(s)`,
      );

      await db().execute(
        `INSERT INTO game_scorers (id, game_id, player_id, player_name, player_number, goal_count)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          scorerId,
          gameId,
          playerId,
          player.name,
          playerNumber || null,
          goalCount,
        ],
      );
    }

    // Calculate total goals from all scorers for this game
    const totalScoresResult = await db().execute(
      "SELECT SUM(goal_count) as total_goals FROM game_scorers WHERE game_id = ?",
      [gameId],
    );

    const totalGoals = totalScoresResult.rows[0].total_goals || 0;

    // Update game score_for
    await db().execute("UPDATE games SET score_for = ? WHERE id = ?", [
      totalGoals,
      gameId,
    ]);

    console.log(
      `[POST /api/games/:gameId/scores] Game score updated: ${totalGoals} goals`,
    );

    // Return updated scorer with player details
    return NextResponse.json(
      {
        success: true,
        data: {
          id: scorerId,
          game_id: gameId,
          player_id: playerId,
          player_name: player.name,
          player_number: playerNumber || null,
          goal_count: newGoalCount,
          game_score_for: totalGoals,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/games/:gameId/scores] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record goal" },
      { status: 500 },
    );
  }
}

// ============================================================================
// PATCH update goal count for a player in a game
// ============================================================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params;
  console.log(
    `[PATCH /api/games/:gameId/scores] Updating scorer for game: ${gameId}`,
  );

  try {
    const body = await request.json();
    const { scorerId, newGoalCount } = body;

    console.log("[PATCH /api/games/:gameId/scores] Request body:", body);

    if (!scorerId) {
      console.warn("[PATCH /api/games/:gameId/scores] scorerId is required");
      return NextResponse.json(
        { success: false, error: "Scorer ID is required" },
        { status: 400 },
      );
    }

    if (newGoalCount < 0 || typeof newGoalCount !== "number") {
      console.warn(
        `[PATCH /api/games/:gameId/scores] Invalid newGoalCount: ${newGoalCount}`,
      );
      return NextResponse.json(
        { success: false, error: "Goal count must be >= 0" },
        { status: 400 },
      );
    }

    // Check game is not completed
    const gameResult = await db().execute(
      "SELECT status FROM games WHERE id = ?",
      [gameId],
    );

    if (gameResult.rows.length === 0) {
      console.warn(
        `[PATCH /api/games/:gameId/scores] Game not found: ${gameId}`,
      );
      return NextResponse.json(
        { success: false, error: "Game not found" },
        { status: 404 },
      );
    }

    if (gameResult.rows[0].status === "completed") {
      console.warn(
        `[PATCH /api/games/:gameId/scores] Cannot update completed game`,
      );
      return NextResponse.json(
        { success: false, error: "Cannot update scores on completed games" },
        { status: 409 },
      );
    }

    // Check scorer exists
    const scorerResult = await db().execute(
      "SELECT goal_count FROM game_scorers WHERE id = ? AND game_id = ?",
      [scorerId, gameId],
    );

    if (scorerResult.rows.length === 0) {
      console.warn(
        `[PATCH /api/games/:gameId/scores] Scorer not found: ${scorerId}`,
      );
      return NextResponse.json(
        { success: false, error: "Scorer not found" },
        { status: 404 },
      );
    }

    const oldGoalCount = scorerResult.rows[0].goal_count as number;
    console.log(
      `[PATCH /api/games/:gameId/scores] Updating goals: ${oldGoalCount} -> ${newGoalCount}`,
    );

    if (newGoalCount === 0) {
      // Delete scorer if goal count becomes 0
      console.log(
        `[PATCH /api/games/:gameId/scores] Deleting scorer (goal count = 0)`,
      );
      await db().execute("DELETE FROM game_scorers WHERE id = ?", [scorerId]);
    } else {
      // Update goal count
      await db().execute("UPDATE game_scorers SET goal_count = ? WHERE id = ?", [
        newGoalCount,
        scorerId,
      ]);
    }

    // Recalculate total goals for this game
    const totalScoresResult = await db().execute(
      "SELECT SUM(goal_count) as total_goals FROM game_scorers WHERE game_id = ?",
      [gameId],
    );

    const totalGoals = totalScoresResult.rows[0].total_goals || 0;

    // Update game score_for
    await db().execute("UPDATE games SET score_for = ? WHERE id = ?", [
      totalGoals,
      gameId,
    ]);

    console.log(
      `[PATCH /api/games/:gameId/scores] Game score recalculated: ${totalGoals} goals`,
    );

    return NextResponse.json({
      success: true,
      data: {
        scorerId,
        newGoalCount,
        game_score_for: totalGoals,
      },
    });
  } catch (error) {
    console.error("[PATCH /api/games/:gameId/scores] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update score" },
      { status: 500 },
    );
  }
}

// ============================================================================
// DELETE remove a scorer from a game
// ============================================================================
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params;
  console.log(
    `[DELETE /api/games/:gameId/scores] Removing scorer from game: ${gameId}`,
  );

  try {
    const body = await request.json();
    const { scorerId } = body;

    console.log("[DELETE /api/games/:gameId/scores] Request body:", body);

    if (!scorerId) {
      console.warn("[DELETE /api/games/:gameId/scores] scorerId is required");
      return NextResponse.json(
        { success: false, error: "Scorer ID is required" },
        { status: 400 },
      );
    }

    // Check game is not completed
    const gameResult = await db().execute(
      "SELECT status FROM games WHERE id = ?",
      [gameId],
    );

    if (gameResult.rows.length === 0) {
      console.warn(
        `[DELETE /api/games/:gameId/scores] Game not found: ${gameId}`,
      );
      return NextResponse.json(
        { success: false, error: "Game not found" },
        { status: 404 },
      );
    }

    if (gameResult.rows[0].status === "completed") {
      console.warn(
        `[DELETE /api/games/:gameId/scores] Cannot delete from completed game`,
      );
      return NextResponse.json(
        { success: false, error: "Cannot delete scores from completed games" },
        { status: 409 },
      );
    }

    // Check scorer exists and get goal count
    const scorerResult = await db().execute(
      "SELECT goal_count, player_name FROM game_scorers WHERE id = ? AND game_id = ?",
      [scorerId, gameId],
    );

    if (scorerResult.rows.length === 0) {
      console.warn(
        `[DELETE /api/games/:gameId/scores] Scorer not found: ${scorerId}`,
      );
      return NextResponse.json(
        { success: false, error: "Scorer not found" },
        { status: 404 },
      );
    }

    const deletedGoals = scorerResult.rows[0].goal_count as number;
    const playerName = scorerResult.rows[0].player_name;

    // Delete scorer
    console.log(
      `[DELETE /api/games/:gameId/scores] Deleting scorer: ${playerName} (${deletedGoals} goals)`,
    );

    await db().execute("DELETE FROM game_scorers WHERE id = ?", [scorerId]);

    // Recalculate total goals for this game
    const totalScoresResult = await db().execute(
      "SELECT SUM(goal_count) as total_goals FROM game_scorers WHERE game_id = ?",
      [gameId],
    );

    const totalGoals = totalScoresResult.rows[0].total_goals || 0;

    // Update game score_for
    await db().execute("UPDATE games SET score_for = ? WHERE id = ?", [
      totalGoals,
      gameId,
    ]);

    console.log(
      `[DELETE /api/games/:gameId/scores] Game score recalculated: ${totalGoals} goals`,
    );

    return NextResponse.json({
      success: true,
      message: `${playerName} removed from scorers (${deletedGoals} goals deleted)`,
      data: {
        scorerId,
        game_score_for: totalGoals,
      },
    });
  } catch (error) {
    console.error("[DELETE /api/games/:gameId/scores] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete scorer" },
      { status: 500 },
    );
  }
}
