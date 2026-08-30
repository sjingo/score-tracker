import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";
import { Game } from "@/components/types";

// ============================================================================
// PATCH update - increment score_against by gameId should default to 0 if not set score is 1
// ============================================================================
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const { gameId } = await params;
  console.log(
    `[PATCH /api/games/:gameId/opposition-goal] updating opposition score for: ${gameId}`,
  );
  const req = await request?.json();
  const { goalCount } = req;

  console.log(
    `[PATCH /api/games/:gameId/opposition-goal] goalCount: ${goalCount}`,
  );

  if (Number.isNaN(goalCount) || Number(goalCount) === 0) {
    return NextResponse.json(
      { success: false, error: "Number is 0" },
      { status: 500 },
    );
  }

  try {
    // Fetch game to verify it exists
    const gResult = await db.execute({
      sql: "SELECT score_against FROM games WHERE id = ?",
      args: [gameId],
    });
    const query = gResult?.rows?.[0] || null;
    const { score_against: scoreAgainst } = query || undefined;

    if (!query) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // update score - can only be 0 or positive integer
    const updatedScoreAgainst = Number(
      ((scoreAgainst || 0) as number) + goalCount >= 0
        ? ((scoreAgainst || 0) as number) + goalCount
        : 0,
    );

    // Update the game with the new score
    const updatedGame = await db.execute({
      sql: "UPDATE games SET score_against = ? WHERE id = ?",
      args: [updatedScoreAgainst, gameId],
    });

    return NextResponse.json({
      success: true,
      data: updatedGame,
    });
  } catch (error) {
    console.error("Error updating score against:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update score against" },
      { status: 500 },
    );
  }
}
