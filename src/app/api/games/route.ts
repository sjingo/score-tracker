import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { randomUUID } from "crypto";
import { Row } from "@libsql/client";

// ============================================================================
// GET all games for Lions team (with game_types and scorers)
// ============================================================================
interface EnrichedGame {
  scorers: Row[];
  length: number;
}
export async function GET() {
  console.log("[GET /api/games] Fetching all games for Lions team");

  try {
    // Get Lions team ID
    const teamsResult = await db().execute(
      "SELECT id FROM teams WHERE team_name = 'Lions'",
    );

    if (teamsResult.rows.length === 0) {
      console.error("[GET /api/games] Lions team not found");
      return NextResponse.json(
        { success: false, error: "Lions team not found" },
        { status: 404 },
      );
    }

    const lionsTeamId = teamsResult.rows[0].id;
    console.log(`[GET /api/games] Lions team ID: ${lionsTeamId}`);

    // Fetch all games with game_types
    const gamesResult = await db().execute(
      `SELECT g.*, gt.display_name as game_type_display, gt.color as game_type_color
       FROM games g
       JOIN game_types gt ON g.game_type_id = gt.id
       WHERE g.team_id = ?
       ORDER BY g.match_date DESC`,
      [lionsTeamId],
    );

    console.log(`[GET /api/games] Retrieved ${gamesResult.rows.length} games`);

    // Enrich each game with scorers and assists
    const enrichedGames = await Promise.all(
      //@ts-expect-error TODO: type EnrichedGame
      gamesResult.rows.map(async (game: EnrichedGame[]) => {
        const scorersResult = await db().execute(
          `SELECT gs.*, p.anonymised_id
          FROM game_scorers gs
          LEFT JOIN players p ON gs.player_id = p.id
          WHERE gs.game_id = ?
          ORDER BY gs.goal_count DESC`,
          // @ts-expect-error TODO: type EnrichedGame
          [game.id],
        );

        const assistsResult = await db().execute(
          `SELECT ga.*, p.anonymised_id
          FROM game_assists ga
          LEFT JOIN players p ON ga.player_id = p.id
          WHERE ga.game_id = ?
          ORDER BY ga.assist_count DESC`,
          // @ts-expect-error TODO: type EnrichedGame
          [game.id],
        );

        return {
          ...game,
          scorers: scorersResult.rows || [],
          assists: assistsResult.rows || [],
        };
      }),
    );

    console.log(
      `[GET /api/games] Response: ${enrichedGames.length} games with scorers`,
    );

    return NextResponse.json({
      success: true,
      data: enrichedGames,
    });
  } catch (error) {
    console.error("[GET /api/games] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch games" },
      { status: 500 },
    );
  }
}

// ============================================================================
// POST create new game
// ============================================================================
export async function POST(request: NextRequest) {
  console.log("[POST /api/games] Creating new game");

  try {
    const body = await request.json();
    console.log("[POST /api/games] Request body:", body);

    const {
      oppositionName,
      oppositionTeamId,
      gameTypeId,
      matchDate,
      venue,
      notes,
      tournamentName,
      location,
    } = body;

    // Validation
    if (!oppositionName || !oppositionName.trim()) {
      console.warn(
        "[POST /api/games] Validation failed: opposition_name empty",
      );
      return NextResponse.json(
        { success: false, error: "Opposition name is required" },
        { status: 400 },
      );
    }

    if (!gameTypeId) {
      console.warn("[POST /api/games] Validation failed: gameTypeId missing");
      return NextResponse.json(
        { success: false, error: "Game type is required" },
        { status: 400 },
      );
    }

    if (!oppositionTeamId) {
      return NextResponse.json(
        { success: false, error: "Opposition team is required" },
        { status: 400 },
      );
    }

    // Get Lions team ID
    const teamsResult = await db().execute(
      "SELECT id FROM teams WHERE team_name = 'Lions'",
    );

    if (teamsResult.rows.length === 0) {
      console.error("[POST /api/games] Lions team not found");
      return NextResponse.json(
        { success: false, error: "Lions team not found" },
        { status: 404 },
      );
    }

    const lionsTeamId = teamsResult.rows[0].id;
    console.log(`[POST /api/games] Lions team ID: ${lionsTeamId}`);

    const oppositionTeamResult = await db().execute(
      "SELECT id, team_name FROM teams WHERE id = ? AND id <> ?",
      [oppositionTeamId, lionsTeamId],
    );

    if (oppositionTeamResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Invalid opposition team" },
        { status: 400 },
      );
    }

    const oppositionTeam = oppositionTeamResult.rows[0];

    // Validate game_type_id exists and belongs to Lions
    const gameTypeResult = await db().execute(
      "SELECT id, display_name, color FROM game_types WHERE id = ? AND team_id = ?",
      [gameTypeId, lionsTeamId],
    );

    if (gameTypeResult.rows.length === 0) {
      console.warn(`[POST /api/games] Game type not found: ${gameTypeId}`);
      return NextResponse.json(
        { success: false, error: "Invalid game type" },
        { status: 400 },
      );
    }

    const gameType = gameTypeResult.rows[0];
    console.log(
      `[POST /api/games] Game type validated: ${gameType.display_name}`,
    );

    // Use provided match_date or default to today
    const finalMatchDate = matchDate || new Date().toISOString().split("T")[0];
    console.log(`[POST /api/games] Match date: ${finalMatchDate}`);

    const gameId = randomUUID();
    console.log(`[POST /api/games] Generated game ID: ${gameId}`);

    // Insert game
    await db().execute(
      `INSERT INTO games (id, team_id, opposition_team_id, opposition_name, game_type_id, tournament_name, location, score_for, score_against, match_date, status, venue, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        gameId,
        lionsTeamId,
        oppositionTeamId,
        oppositionTeam.team_name,
        gameTypeId,
        tournamentName || null,
        location || null,
        0, // score_for
        0, // score_against
        finalMatchDate,
        "in-progress", // status
        venue || null,
        notes || null,
      ],
    );

    console.log(`[POST /api/games] Game created successfully: ${gameId}`);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: gameId,
          team_id: lionsTeamId,
          opposition_team_id: oppositionTeamId,
          opposition_name: oppositionTeam.team_name,
          game_type_id: gameTypeId,
          game_type_display: gameType.display_name,
          game_type_color: gameType.color,
          score_for: 0,
          score_against: 0,
          match_date: finalMatchDate,
          status: "in-progress",
          venue: venue || null,
          tournament_name: tournamentName || null,
          location: location || null,
          notes: notes || null,
          scorers: [],
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/games] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create game" },
      { status: 500 },
    );
  }
}
