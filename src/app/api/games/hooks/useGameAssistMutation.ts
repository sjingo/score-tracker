"use client";

import { useMutation } from "@tanstack/react-query";
import { Dispatch, SetStateAction } from "react";
import { Assist, Game, Player } from "@/components/types";

export interface GameAssistInput {
  gameId: string;
  assistCount: number;
  player: Player;
}

export interface GameAssistResult {
  id: string;
  game_id: string;
  player_id: string;
  player_name: string;
  player_number: number | null;
  assist_count: number;
}

async function recordGameAssist(
  input: GameAssistInput,
): Promise<GameAssistResult> {
  const response = await fetch(`/api/games/${input.gameId}/assists`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      playerId: input.player.id,
      playerName: input.player.name,
      playerNumber: input.player.jersey_number,
      assistCount: input.assistCount,
    }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || "Failed to record assist");
  }

  return result.data as GameAssistResult;
}

interface UseGameAssistMutationOptions {
  games: Game[];
  setGames: Dispatch<SetStateAction<Game[]>>;
}

function applyOptimisticAssist(games: Game[], input: GameAssistInput): Game[] {
  return games.map((game) => {
    if (game.id !== input.gameId) return game;

    const currentAssists = game.assists || [];
    const currentAssist = currentAssists.find(
      (assist) => assist.player_id === input.player.id,
    );
    const nextAssistCount =
      (currentAssist?.assist_count || 0) + input.assistCount;

    if (nextAssistCount < 0) return game;

    const nextAssists =
      nextAssistCount === 0
        ? currentAssists.filter(
            (assist) => assist.player_id !== input.player.id,
          )
        : currentAssist
          ? currentAssists.map((assist) =>
              assist.player_id === input.player.id
                ? { ...assist, assist_count: nextAssistCount }
                : assist,
            )
          : [
              ...currentAssists,
              {
                id: `optimistic-${input.gameId}-${input.player.id}`,
                player_id: input.player.id,
                player_name: input.player.name,
                assist_count: nextAssistCount,
                anonymised_id: input.player.anonymised_id,
              } satisfies Assist,
            ];

    return { ...game, assists: nextAssists };
  });
}

export function useGameAssistMutation({
  games,
  setGames,
}: UseGameAssistMutationOptions) {
  return useMutation({
    mutationFn: recordGameAssist,
    onMutate: (input) => {
      const previousGames = games;
      setGames((currentGames) => applyOptimisticAssist(currentGames, input));
      return { previousGames };
    },
    onError: (_error, _input, context) => {
      if (context?.previousGames) setGames(context.previousGames);
    },
  });
}
