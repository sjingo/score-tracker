import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET all game types for Lions team
export async function GET() {
  try {
    // Get Lions team ID
    const teamsResult = await db().execute(
      "SELECT id FROM teams WHERE team_name = 'Lions'",
    );

    if (teamsResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Lions team not found" },
        { status: 404 },
      );
    }

    const lionsTeamId = teamsResult.rows[0].id;

    const result = await db().execute(
      "SELECT * FROM game_types WHERE team_id = ? ORDER BY display_name ASC",
      [lionsTeamId],
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching game types:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch game types" },
      { status: 500 },
    );
  }
}
