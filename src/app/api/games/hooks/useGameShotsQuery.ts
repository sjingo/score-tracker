"use client";

import { useQuery } from "@tanstack/react-query";
import { ShotType } from "./useGameShotMutation";

export interface GameShot {
  id: string;
  game_id: string;
  shot_type: ShotType;
  xg_value: number;
}

async function fetchGameShots(gameId: string): Promise<GameShot[]> {
  const response = await fetch(`/api/games/${gameId}/shots`);
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || "Failed to load shots");
  }

  return result.data;
}

export function useGameShotsQuery(gameId: string) {
  return useQuery({
    queryKey: ["games", gameId, "shots"],
    queryFn: () => fetchGameShots(gameId),
    staleTime: 30_000,
  });
}
