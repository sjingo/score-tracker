"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dispatch, SetStateAction } from "react";
import { Game, GameType } from "@/components/types";

export interface GameTypeInput {
  gameId: string;
  gameType: GameType;
}

async function updateGameType({
  gameId,
  gameType,
}: GameTypeInput): Promise<Game> {
  const response = await fetch(`/api/games/${gameId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameTypeId: gameType.id }),
  });
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || "Failed to update game type");
  }

  return result.data as Game;
}

interface UseGameTypeMutationOptions {
  games: Game[];
  setGames: Dispatch<SetStateAction<Game[]>>;
}

export function useGameTypeMutation({
  games,
  setGames,
}: UseGameTypeMutationOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateGameType,
    onMutate: async ({ gameId, gameType }) => {
      await queryClient.cancelQueries({ queryKey: ["games"] });
      const previousQueryGames = queryClient.getQueryData<Game[]>(["games"]);
      const previousGames = games;
      const updateGames = (currentGames: Game[]) =>
        currentGames.map((game) =>
          game.id === gameId
            ? {
                ...game,
                game_type_id: gameType.id,
                game_type_display: gameType.display_name,
                game_type_color: gameType.color,
              }
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
