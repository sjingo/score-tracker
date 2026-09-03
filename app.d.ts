interface teams {
  id: string;
  team_name: string;
}

interface players {
  id: string;
  name: string;
  jersey_number: string;
  anonymised_id: string;
  is_active: number;
}

interface game_types {
  id: string;
  team_id: string;
  type_name: string;
  display_name: string;
  is_deletable: number;
  is_default: number;
  color: string;
}

interface games {
  id: string;
  team_id: string;
  opposition_team_id: string;
  opposition_name: string;
  game_type_id: string;
  tournament_name: string;
  score_for: number;
  score_against: number;
  match_date: string;
  status: string;
  location: string;
  venue: string;
  notes: string;
  game_type_display: string;
  game_type_color: string;
}

interface game_scorers {
  id: string;
  game_id: string;
  player_id: string;
  player_name: string;
  player_number: string;
  goal_count: number;
  player_full_name: string;
  anonymised_id: string;
}

interface season_stats {
  id: string;
  team_id: string;
  season: string;
  total_games_played: number;
  total_wins: number;
  total_draws: number;
  total_goals_for: number;
  total_goals_against: number;
  goal_difference: number;
  top_scorer: string;
  top_scorer_name: string;
  top_scorer_goals: number;
}
