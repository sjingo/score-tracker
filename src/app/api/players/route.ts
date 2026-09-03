import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";

// GET all players
export async function GET() {
  try {
    const result = await db().execute(
      "SELECT * FROM players WHERE is_active = 1 ORDER BY jersey_number ASC",
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching players:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch players" },
      { status: 500 },
    );
  }
}

// POST new player
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, jerseyNumber } = body;

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Player name is required" },
        { status: 400 },
      );
    }

    // Jersey number validation: optional but must be 1-99 if provided
    if (
      jerseyNumber !== null &&
      jerseyNumber !== undefined &&
      jerseyNumber !== ""
    ) {
      const num = parseInt(jerseyNumber, 10);
      if (isNaN(num) || num < 1 || num > 99) {
        return NextResponse.json(
          { success: false, error: "Jersey number must be between 1 and 99" },
          { status: 400 },
        );
      }
    }

    const playerId = randomUUID();
    const anonymisedId = `lions_${jerseyNumber || randomUUID().slice(0, 8)}`;

    await db().execute(
      "INSERT INTO players (id, name, jersey_number, anonymised_id, is_active) VALUES (?, ?, ?, ?, ?)",
      [playerId, name, jerseyNumber || null, anonymisedId, 1],
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          id: playerId,
          name,
          jerseyNumber,
          anonymisedId,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating player:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create player" },
      { status: 500 },
    );
  }
}
