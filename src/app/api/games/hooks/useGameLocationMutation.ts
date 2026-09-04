"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dispatch, SetStateAction } from "react";
import { Game } from "@/components/types";

export interface GameLocationInput {
  gameId: string;
  location: string;
}

async function updateGameLocation({
  gameId,
  location,
}: GameLocationInput): Promise<Game> {
  const response = await fetch(`/api/games/${gameId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ location }),
  });
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || "Failed to update game location");
  }

  return result.data as Game;
}

interface UseGameLocationMutationOptions {
  games: Game[];
  setGames: Dispatch<SetStateAction<Game[]>>;
}

export function useGameLocationMutation({
  games,
  setGames,
}: UseGameLocationMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateGameLocation,
    onMutate: async ({ gameId, location }) => {
      await queryClient.cancelQueries({ queryKey: ["games"] });
      const previousQueryGames = queryClient.getQueryData<Game[]>(["games"]);
      const previousGames = games;
      const updateGames = (currentGames: Game[]) =>
        currentGames.map((game) =>
          game.id === gameId
            ? { ...game, location: location || undefined }
            : game,
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
