//Games
export const OPPOSITION_GOAL = "Opposition goal";

export interface Game {
  id: string;
  opposition_team_id?: string;
  opposition_name: string;
  score_for: number;
  score_against: number;
  match_date: string;
  status: string;
  game_type_id: string;
  game_type_display: string;
  game_type_color?: string;
  location?: string;
  scorers?: Scorer[];
  assists?: Assist[];
}

export interface Team {
  id: string;
  team_name: string;
}

export interface Scorer {
  id: string;
  player_id: string;
  player_name: string;
  goal_count: number;
  anonymised_id?: string;
}

export interface Assist {
  id: string;
  player_id: string;
  player_name: string;
  assist_count: number;
  anonymised_id?: string;
}

export interface Player {
  id: string;
  name: string;
  jersey_number: number;
  anonymised_id: string;
  is_active: boolean;
}

export interface GameType {
  id: string;
  display_name: string;
  color?: string;
}
