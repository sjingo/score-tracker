"use client";

import { useMutation } from "@tanstack/react-query";
import { Dispatch, SetStateAction } from "react";
import { Game } from "@/components/types";

export interface GameGoalInput {
  gameId: string;
  goalCount: number;
  player?: {
    id: string;
    name: string;
    jersey_number: number;
    anonymised_id: string;
  };
  isOppositionGoal?: boolean;
}

export type GameGoalResult =
  | {
      type: "scorer";
      id: string;
      player_id: string;
      player_name: string;
      goal_count: number;
      game_score_for: number;
    }
  | {
      type: "opposition";
      game_id: string;
      score_against: number;
    };

async function recordGameGoal(input: GameGoalInput): Promise<GameGoalResult> {
  const isOppositionGoal = input.isOppositionGoal === true;
  const response = await fetch(
    isOppositionGoal
      ? `/api/games/${input.gameId}/opposition-goal`
      : `/api/games/${input.gameId}/scores`,
    {
      method: isOppositionGoal ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        isOppositionGoal
          ? { goalCount: input.goalCount }
          : {
              playerId: input.player?.id,
              playerName: input.player?.name,
              playerNumber: input.player?.jersey_number,
              goalCount: input.goalCount,
            },
      ),
    },
  );

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || "Failed to record goal");
  }

  return {
    type: isOppositionGoal ? "opposition" : "scorer",
    ...result.data,
  } as GameGoalResult;
}

interface UseGameGoalMutationOptions {
  games: Game[];
  setGames: Dispatch<SetStateAction<Game[]>>;
}

function applyOptimisticGoal(games: Game[], input: GameGoalInput): Game[] {
  return games.map((game) => {
    if (game.id !== input.gameId) return game;

    if (input.isOppositionGoal) {
      return {
        ...game,
        score_against: Math.max(0, game.score_against + input.goalCount),
      };
    }

    if (!input.player) return game;

    const currentScorers = game.scorers || [];
    const currentScorer = currentScorers.find(
      (scorer) => scorer.player_id === input.player?.id,
    );
    const nextGoalCount = (currentScorer?.goal_count || 0) + input.goalCount;

    if (nextGoalCount < 0) return game;

    const nextScorers =
      nextGoalCount === 0
        ? currentScorers.filter(
            (scorer) => scorer.player_id !== input.player?.id,
          )
        : currentScorer
          ? currentScorers.map((scorer) =>
              scorer.player_id === input.player?.id
                ? { ...scorer, goal_count: nextGoalCount }
                : scorer,
            )
          : [
              ...currentScorers,
              {
                id: `optimistic-${input.gameId}-${input.player.id}`,
                player_id: input.player.id,
                player_name: input.player.name,
                goal_count: nextGoalCount,
                anonymised_id: input.player.anonymised_id,
              },
            ];

    return {
      ...game,
      score_for: Math.max(0, game.score_for + input.goalCount),
      scorers: nextScorers,
    };
  });
}

export function useGameGoalMutation({
  games,
  setGames,
}: UseGameGoalMutationOptions) {
  return useMutation({
    mutationFn: recordGameGoal,
    onMutate: (input) => {
      const previousGames = games;
      setGames((currentGames) => applyOptimisticGoal(currentGames, input));
      return { previousGames };
    },
    onError: (_error, _input, context) => {
      if (context?.previousGames) setGames(context.previousGames);
    },
  });
}
