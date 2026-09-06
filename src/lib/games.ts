import { db } from "@/lib/db";
import { Game } from "@/components/types";

function toPlainObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(Object.entries(value));
}

export async function getGames(): Promise<Game[]> {
  const teamsResult = await db().execute(
    "SELECT id FROM teams WHERE team_name = 'Lions'",
  );

  if (teamsResult.rows.length === 0) {
    throw new Error("Lions team not found");
  }

  const lionsTeamId = teamsResult.rows[0].id;
  const gamesResult = await db().execute(
    `SELECT g.*, gt.display_name as game_type_display, gt.color as game_type_color
     FROM games g
     JOIN game_types gt ON g.game_type_id = gt.id
     WHERE g.team_id = ?
     ORDER BY g.match_date DESC`,
    [lionsTeamId],
  );

  const enrichedGames = await Promise.all(
    gamesResult.rows.map(async (game) => {
      const scorersResult = await db().execute(
        `SELECT gs.*, p.anonymised_id
         FROM game_scorers gs
         LEFT JOIN players p ON gs.player_id = p.id
         WHERE gs.game_id = ?
         ORDER BY gs.goal_count DESC`,
        [game.id],
      );
      const assistsResult = await db().execute(
        `SELECT ga.*, p.anonymised_id
         FROM game_assists ga
         LEFT JOIN players p ON ga.player_id = p.id
         WHERE ga.game_id = ?
         ORDER BY ga.assist_count DESC`,
        [game.id],
      );
      const savesResult = await db().execute(
        `SELECT gs.*, p.anonymised_id
         FROM game_saves gs
         LEFT JOIN players p ON gs.player_id = p.id
         WHERE gs.game_id = ?
         ORDER BY gs.save_count DESC`,
        [game.id],
      );

      return {
        ...toPlainObject(game),
        scorers: (scorersResult.rows || []).map(toPlainObject),
        assists: (assistsResult.rows || []).map(toPlainObject),
        saves: (savesResult.rows || []).map(toPlainObject),
      };
    }),
  );

  return enrichedGames as unknown as Game[];
}
