import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";

const SHOT_VALUES = {
  big_chance: 0.5,
  on_target: 0.3,
  off_target: 0.15,
  long_range: 0.05,
} as const;

type ShotType = keyof typeof SHOT_VALUES;

function isShotType(value: unknown): value is ShotType {
  return typeof value === "string" && value in SHOT_VALUES;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params;

  try {
    const body = await request.json();
    const { shotType } = body;

    if (!isShotType(shotType)) {
      return NextResponse.json(
        { success: false, error: "Invalid shot type" },
        { status: 400 },
      );
    }

    const gameResult = await db().execute(
      "SELECT id, status FROM games WHERE id = ?",
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
        { success: false, error: "Cannot record shots on completed games" },
        { status: 409 },
      );
    }

    const shot = {
      id: randomUUID(),
      game_id: gameId,
      shot_type: shotType,
      xg_value: SHOT_VALUES[shotType],
    };

    await db().execute(
      `INSERT INTO game_shots
        (id, game_id, shot_type, xg_value)
       VALUES (?, ?, ?, ?)`,
      [shot.id, shot.game_id, shot.shot_type, shot.xg_value],
    );

    return NextResponse.json({ success: true, data: shot }, { status: 201 });
  } catch (error) {
    console.error(`[POST /api/games/${gameId}/shots] Error:`, error);
    return NextResponse.json(
      { success: false, error: "Failed to record shot" },
      { status: 500 },
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params;

  try {
    const result = await db().execute(
      `SELECT id, game_id, shot_type, xg_value
       FROM game_shots
       WHERE game_id = ?
       ORDER BY rowid DESC`,
      [gameId],
    );

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error(`[GET /api/games/${gameId}/shots] Error:`, error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch shots" },
      { status: 500 },
    );
  }
}

async function ensureEditableGame(gameId: string) {
  const result = await db().execute("SELECT status FROM games WHERE id = ?", [
    gameId,
  ]);

  if (result.rows.length === 0) return "not-found";
  if (result.rows[0].status === "completed") return "completed";
  return "editable";
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params;

  try {
    const body = await request.json();
    const { shotId, shotType } = body;

    if (typeof shotId !== "string" || !shotId.trim() || !isShotType(shotType)) {
      return NextResponse.json(
        { success: false, error: "Shot ID and valid shot type are required" },
        { status: 400 },
      );
    }

    const gameStatus = await ensureEditableGame(gameId);
    if (gameStatus === "not-found") {
      return NextResponse.json(
        { success: false, error: "Game not found" },
        { status: 404 },
      );
    }
    if (gameStatus === "completed") {
      return NextResponse.json(
        { success: false, error: "Cannot edit shots on completed games" },
        { status: 409 },
      );
    }

    const result = await db().execute(
      `UPDATE game_shots
       SET shot_type = ?, xg_value = ?
       WHERE id = ? AND game_id = ?`,
      [shotType, SHOT_VALUES[shotType], shotId, gameId],
    );

    if (result.rowsAffected === 0) {
      return NextResponse.json(
        { success: false, error: "Shot not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: shotId,
        game_id: gameId,
        shot_type: shotType,
        xg_value: SHOT_VALUES[shotType],
      },
    });
  } catch (error) {
    console.error(`[PATCH /api/games/${gameId}/shots] Error:`, error);
    return NextResponse.json(
      { success: false, error: "Failed to update shot" },
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
    const { shotId } = await request.json();
    if (typeof shotId !== "string" || !shotId.trim()) {
      return NextResponse.json(
        { success: false, error: "Shot ID is required" },
        { status: 400 },
      );
    }

    const gameStatus = await ensureEditableGame(gameId);
    if (gameStatus === "not-found") {
      return NextResponse.json(
        { success: false, error: "Game not found" },
        { status: 404 },
      );
    }
    if (gameStatus === "completed") {
      return NextResponse.json(
        { success: false, error: "Cannot delete shots from completed games" },
        { status: 409 },
      );
    }

    const result = await db().execute(
      "DELETE FROM game_shots WHERE id = ? AND game_id = ?",
      [shotId, gameId],
    );

    if (result.rowsAffected === 0) {
      return NextResponse.json(
        { success: false, error: "Shot not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: { id: shotId } });
  } catch (error) {
    console.error(`[DELETE /api/games/${gameId}/shots] Error:`, error);
    return NextResponse.json(
      { success: false, error: "Failed to delete shot" },
      { status: 500 },
    );
  }
}
