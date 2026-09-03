import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";

export async function GET() {
  try {
    const result = await db().execute(
      "SELECT id, team_name FROM teams WHERE team_name <> 'Lions' ORDER BY team_name ASC",
    );

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("Error fetching opposition teams:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch teams" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { teamName } = await request.json();
    const trimmedName = typeof teamName === "string" ? teamName.trim() : "";

    if (!trimmedName) {
      return NextResponse.json(
        { success: false, error: "Team name is required" },
        { status: 400 },
      );
    }

    if (trimmedName.toLowerCase() === "lions") {
      return NextResponse.json(
        { success: false, error: "Lions cannot be an opposition team" },
        { status: 400 },
      );
    }

    const existing = await db().execute(
      "SELECT id, team_name FROM teams WHERE lower(team_name) = lower(?)",
      [trimmedName],
    );

    if (existing.rows.length > 0) {
      return NextResponse.json({ success: true, data: existing.rows[0] });
    }

    const team = { id: randomUUID(), team_name: trimmedName };
    await db().execute("INSERT INTO teams (id, team_name) VALUES (?, ?)", [
      team.id,
      team.team_name,
    ]);

    return NextResponse.json({ success: true, data: team }, { status: 201 });
  } catch (error) {
    console.error("Error creating opposition team:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create team" },
      { status: 500 },
    );
  }
}
