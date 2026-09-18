import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/authorization";
import { db } from "@/lib/db";
import { getPushConfiguration, sendPushNotificationToAll } from "@/lib/push";

export async function POST(request: NextRequest) {
  const authorization = await requireRole(request, "admin");

  if (authorization instanceof Response) return authorization;

  if (!getPushConfiguration().configured) {
    return NextResponse.json(
      { success: false, error: "Push notifications are not configured" },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as { gameId?: unknown };
    const gameId = typeof body.gameId === "string" ? body.gameId.trim() : "";

    if (!gameId) {
      return NextResponse.json(
        { success: false, error: "A game ID is required" },
        { status: 400 },
      );
    }

    const gameResult = await db().execute(
      `SELECT opposition_name, score_for, score_against, status
       FROM games
       WHERE id = ?`,
      [gameId],
    );

    if (gameResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Game not found" },
        { status: 404 },
      );
    }

    const game = gameResult.rows[0];
    if (game.status !== "completed") {
      return NextResponse.json(
        { success: false, error: "Only completed games can be announced" },
        { status: 409 },
      );
    }

    const result = await sendPushNotificationToAll({
      title: `${Number(game.score_for)} - ${Number(game.score_against)} | Lions vs ${game.opposition_name}`,
      body: "Match and player stats have been updated.",
      url: "/matches",
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[POST /api/push/broadcast] Error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to broadcast match update" },
      { status: 500 },
    );
  }
}
