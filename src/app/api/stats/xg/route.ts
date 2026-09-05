import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/authorization";

const SHOT_TYPES = [
  { type: "big_chance", label: "Big chance", value: 0.5 },
  { type: "on_target", label: "Shot on target", value: 0.3 },
  { type: "off_target", label: "Shot off target", value: 0.15 },
  { type: "long_range", label: "Long range", value: 0.05 },
] as const;

export async function GET(request: NextRequest) {
  try {
    const authorization = await requireRole(request, "admin");
    if (authorization instanceof Response) return authorization;

    const result = await db().execute(`
      SELECT
        g.id AS game_id,
        g.opposition_name,
        g.match_date,
        g.status,
        g.score_for,
        gs.shot_type,
        COUNT(gs.id) AS shot_count,
        SUM(gs.xg_value) AS xg
      FROM games g
      LEFT JOIN game_shots gs ON gs.game_id = g.id
      WHERE g.team_id = (SELECT id FROM teams WHERE team_name = 'Lions' LIMIT 1)
      GROUP BY g.id, g.opposition_name, g.match_date, g.status, g.score_for, gs.shot_type
      ORDER BY g.match_date DESC
    `);

    const games = new Map<
      string,
      {
        gameId: string;
        oppositionName: string;
        matchDate: string;
        status: string;
        actualGoals: number;
        totalShots: number;
        totalXg: number;
        breakdown: Array<{
          type: string;
          label: string;
          value: number;
          count: number;
          xg: number;
        }>;
      }
    >();

    for (const row of result.rows) {
      const gameId = String(row.game_id);
      const existing = games.get(gameId) ?? {
        gameId,
        oppositionName: String(row.opposition_name),
        matchDate: String(row.match_date),
        status: String(row.status),
        actualGoals: Number(row.score_for) || 0,
        totalShots: 0,
        totalXg: 0,
        breakdown: [],
      };

      if (row.shot_type) {
        const definition = SHOT_TYPES.find(
          (shot) => shot.type === row.shot_type,
        );
        if (definition) {
          const count = Number(row.shot_count) || 0;
          const xg = Number(row.xg) || 0;
          existing.totalShots += count;
          existing.totalXg += xg;
          existing.breakdown.push({ ...definition, count, xg });
        }
      }

      games.set(gameId, existing);
    }

    return NextResponse.json({
      success: true,
      data: Array.from(games.values()).map((game) => ({
        ...game,
        totalXg: Number(game.totalXg.toFixed(2)),
        breakdown: SHOT_TYPES.map(
          (definition) =>
            game.breakdown.find((item) => item.type === definition.type) ?? {
              ...definition,
              count: 0,
              xg: 0,
            },
        ),
      })),
    });
  } catch (error) {
    console.error("[GET /api/stats/xg] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to calculate xG" },
      { status: 500 },
    );
  }
}
