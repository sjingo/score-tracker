export const DASHBOARD_ROUTES = {
  games: "/games",
  matches: "/matches",
  stats: "/stats",
  players: "/players",
} as const;

export type DashboardTab = keyof typeof DASHBOARD_ROUTES;
