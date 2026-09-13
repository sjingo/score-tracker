"use client";

import { useQuery } from "@tanstack/react-query";
import { GameType } from "@/components/types";

async function fetchGameTypes(): Promise<GameType[]> {
  const response = await fetch("/api/game-types");
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.error || "Failed to load game types");
  }

  return data.data || [];
}

export function useGameTypesQuery(enabled = true) {
  return useQuery({
    queryKey: ["gameTypes"],
    queryFn: fetchGameTypes,
    enabled,
  });
}
