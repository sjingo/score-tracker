"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export const SHOT_OPTIONS = [
  { type: "big_chance", label: "Big chance", xg: 0.5 },
  { type: "on_target", label: "On target", xg: 0.3 },
  { type: "off_target", label: "Off target", xg: 0.15 },
  { type: "long_range", label: "Long range", xg: 0.05 },
] as const;

export type ShotType = (typeof SHOT_OPTIONS)[number]["type"];

export interface GameShotInput {
  gameId: string;
  shotType: ShotType;
}

export interface GameShotResult {
  id: string;
  game_id: string;
  shot_type: ShotType;
  xg_value: number;
}

async function recordGameShot(input: GameShotInput): Promise<GameShotResult> {
  const response = await fetch(`/api/games/${input.gameId}/shots`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      shotType: input.shotType,
    }),
  });
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || "Failed to record shot");
  }

  return result.data as GameShotResult;
}

export function useGameShotMutation() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: recordGameShot,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stats", "xg"] });
      queryClient.invalidateQueries({ queryKey: ["games"] });
    },
  });

  const editMutation = useMutation({
    mutationFn: async (input: {
      gameId: string;
      shotId: string;
      shotType: ShotType;
    }) => {
      const response = await fetch(`/api/games/${input.gameId}/shots`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shotId: input.shotId,
          shotType: input.shotType,
        }),
      });
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.error || "Failed to update shot");
      return result.data as GameShotResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stats", "xg"] });
      queryClient.invalidateQueries({ queryKey: ["games"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (input: { gameId: string; shotId: string }) => {
      const response = await fetch(`/api/games/${input.gameId}/shots`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shotId: input.shotId }),
      });
      const result = await response.json();
      if (!response.ok || !result.success)
        throw new Error(result.error || "Failed to delete shot");
      return result.data as { id: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stats", "xg"] });
      queryClient.invalidateQueries({ queryKey: ["games"] });
    },
  });

  return {
    ...createMutation,
    edit: editMutation,
    remove: deleteMutation,
  };
}
