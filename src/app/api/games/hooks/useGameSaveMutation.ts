"use client";

import { useMutation } from "@tanstack/react-query";
import { Dispatch, SetStateAction } from "react";
import { Game, Player, Save } from "@/components/types";

export interface GameSaveInput {
  gameId: string;
  saveCount: number;
  player: Player;
}

export interface GameSaveResult {
  id: string;
  game_id: string;
  player_id: string;
  player_name: string;
  player_number: number | null;
  save_count: number;
}

async function recordGameSave(input: GameSaveInput): Promise<GameSaveResult> {
  const response = await fetch(`/api/games/${input.gameId}/saves`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      playerId: input.player.id,
      playerNumber: input.player.jersey_number,
      saveCount: input.saveCount,
    }),
  });
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || "Failed to record save");
  }

  return result.data as GameSaveResult;
}

interface UseGameSaveMutationOptions {
  games: Game[];
  setGames: Dispatch<SetStateAction<Game[]>>;
}

function applyOptimisticSave(games: Game[], input: GameSaveInput): Game[] {
  return games.map((game) => {
    if (game.id !== input.gameId) return game;

    const currentSaves = game.saves || [];
    const currentSave = currentSaves.find(
      (save) => save.player_id === input.player.id,
    );
    const nextSaveCount = (currentSave?.save_count || 0) + input.saveCount;

    if (nextSaveCount < 0) return game;

    const nextSaves =
      nextSaveCount === 0
        ? currentSaves.filter((save) => save.player_id !== input.player.id)
        : currentSave
          ? currentSaves.map((save) =>
              save.player_id === input.player.id
                ? { ...save, save_count: nextSaveCount }
                : save,
            )
          : [
              ...currentSaves,
              {
                id: `optimistic-${input.gameId}-${input.player.id}`,
                player_id: input.player.id,
                player_name: input.player.name,
                save_count: nextSaveCount,
                anonymised_id: input.player.anonymised_id,
              } satisfies Save,
            ];

    return { ...game, saves: nextSaves };
  });
}

export function useGameSaveMutation({
  games,
  setGames,
}: UseGameSaveMutationOptions) {
  return useMutation({
    mutationFn: recordGameSave,
    onMutate: (input) => {
      const previousGames = games;
      setGames((currentGames) => applyOptimisticSave(currentGames, input));
      return { previousGames };
    },
    onError: (_error, _input, context) => {
      if (context?.previousGames) setGames(context.previousGames);
    },
  });
}
