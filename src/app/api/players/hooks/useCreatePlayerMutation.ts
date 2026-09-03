"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

export interface CreatePlayerInput {
  name: string;
  jerseyNumber: string;
}

export interface Player {
  id: string;
  name: string;
  jersey_number: number | null;
  anonymised_id: string;
}

async function createPlayer(input: CreatePlayerInput): Promise<Player> {
  const response = await fetch("/api/players", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: input.name,
      jerseyNumber: input.jerseyNumber ? parseInt(input.jerseyNumber) : null,
    }),
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || "Failed to create player");
  }

  return result.data as Player;
}

export function useCreatePlayerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPlayer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["players"] });
    },
  });
}
