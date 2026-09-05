import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params;

  try {
    const gameResult = await db().execute("SELECT id FROM games WHERE id = ?", [
      gameId,
    ]);

    if (gameResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Game not found" },
        { status: 404 },
      );
    }

    const savesResult = await db().execute(
      `SELECT gs.*, p.anonymised_id, p.is_active
       FROM game_saves gs
       LEFT JOIN players p ON gs.player_id = p.id
       WHERE gs.game_id = ?
       ORDER BY gs.save_count DESC, gs.player_name ASC`,
      [gameId],
    );

    return NextResponse.json({ success: true, data: savesResult.rows });
  } catch (error) {
    console.error("[GET /api/games/:gameId/saves] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch saves" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params;

  try {
    const body = await request.json();
    const { playerId, playerNumber, saveCount = 1 } = body;

    if (
      typeof playerId !== "string" ||
      !playerId.trim() ||
      typeof saveCount !== "number" ||
      !Number.isInteger(saveCount) ||
      saveCount === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Player ID and a non-zero integer save count are required",
        },
        { status: 400 },
      );
    }

    const gameResult = await db().execute(
      "SELECT status FROM games WHERE id = ?",
      [gameId],
    );

    if (gameResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Game not found" },
        { status: 404 },
      );
    }

    if (gameResult.rows[0].status === "completed") {
      return NextResponse.json(
        { success: false, error: "Cannot record saves on completed games" },
        { status: 409 },
      );
    }

    const playerResult = await db().execute(
      "SELECT id, name, is_active FROM players WHERE id = ?",
      [playerId],
    );

    if (playerResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Player not found" },
        { status: 404 },
      );
    }

    const player = playerResult.rows[0];
    if (!player.is_active) {
      return NextResponse.json(
        { success: false, error: "Cannot record saves for inactive players" },
        { status: 409 },
      );
    }

    const existingResult = await db().execute(
      "SELECT id, save_count FROM game_saves WHERE game_id = ? AND player_id = ?",
      [gameId, playerId],
    );
    const currentSaveCount = existingResult.rows.length
      ? Number(existingResult.rows[0].save_count)
      : 0;
    const newSaveCount = currentSaveCount + saveCount;

    if (newSaveCount < 0) {
      return NextResponse.json(
        { success: false, error: "Saves cannot be reduced below 0" },
        { status: 400 },
      );
    }

    const saveId = existingResult.rows.length
      ? (existingResult.rows[0].id as string)
      : randomUUID();

    if (existingResult.rows.length) {
      await db().execute("UPDATE game_saves SET save_count = ? WHERE id = ?", [
        newSaveCount,
        saveId,
      ]);
    } else {
      await db().execute(
        `INSERT INTO game_saves
          (id, game_id, player_id, player_name, player_number, save_count)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          saveId,
          gameId,
          playerId,
          player.name,
          playerNumber || null,
          saveCount,
        ],
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: saveId,
          game_id: gameId,
          player_id: playerId,
          player_name: player.name,
          player_number: playerNumber || null,
          save_count: newSaveCount,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/games/:gameId/saves] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to record save" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params;

  try {
    const { saveId } = await request.json();
    if (!saveId) {
      return NextResponse.json(
        { success: false, error: "Save ID is required" },
        { status: 400 },
      );
    }

    const gameResult = await db().execute(
      "SELECT status FROM games WHERE id = ?",
      [gameId],
    );
    if (gameResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Game not found" },
        { status: 404 },
      );
    }
    if (gameResult.rows[0].status === "completed") {
      return NextResponse.json(
        { success: false, error: "Cannot delete saves from completed games" },
        { status: 409 },
      );
    }

    const saveResult = await db().execute(
      "SELECT player_name, save_count FROM game_saves WHERE id = ? AND game_id = ?",
      [saveId, gameId],
    );
    if (saveResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Save not found" },
        { status: 404 },
      );
    }

    await db().execute("DELETE FROM game_saves WHERE id = ?", [saveId]);
    return NextResponse.json({
      success: true,
      data: { saveId },
      message: `${saveResult.rows[0].player_name} removed from saves (${saveResult.rows[0].save_count} saves deleted)`,
    });
  } catch (error) {
    console.error("[DELETE /api/games/:gameId/saves] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete save" },
      { status: 500 },
    );
  }
}
