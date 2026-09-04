"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dispatch, SetStateAction } from "react";
import { Game } from "@/components/types";

export interface GameDateInput {
  gameId: string;
  matchDate: string;
}

interface UseGameDateMutationOptions {
  games: Game[];
  setGames: Dispatch<SetStateAction<Game[]>>;
}

async function updateGameDate({
  gameId,
  matchDate,
}: GameDateInput): Promise<Game> {
  const response = await fetch(`/api/games/${gameId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ matchDate }),
  });
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || "Failed to update game date");
  }

  return result.data as Game;
}

export function useGameDateMutation({
  games,
  setGames,
}: UseGameDateMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateGameDate,
    onMutate: async ({ gameId, matchDate }) => {
      await queryClient.cancelQueries({ queryKey: ["games"] });
      const previousQueryGames = queryClient.getQueryData<Game[]>(["games"]);
      const previousGames = games;
      const updateGames = (currentGames: Game[]) =>
        currentGames.map((game) =>
          game.id === gameId ? { ...game, match_date: matchDate } : game,
        );

      setGames(updateGames);
      queryClient.setQueryData<Game[]>(
        ["games"],
        updateGames(previousQueryGames || games),
      );

      return { previousGames, previousQueryGames };
    },
    onError: (_error, _input, context) => {
      if (context?.previousGames) setGames(context.previousGames);
      queryClient.setQueryData(["games"], context?.previousQueryGames);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["games"] });
    },
  });
}
