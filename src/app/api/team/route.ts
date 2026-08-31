import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET Lions team info
export async function GET() {
  try {
    const result = await db.execute(
      "SELECT * FROM teams WHERE team_name = 'Lions'",
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Lions team not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch team" },
      { status: 500 },
    );
  }
}
