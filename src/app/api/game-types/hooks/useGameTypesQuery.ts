"use client";

import { useQuery } from "@tanstack/react-query";
import { GameType } from "@/components/types";

async function fetchGameTypes(): Promise<GameType[]> {
  const response = await fetch("/api/game-types");
  const data = await response.json();
  return data.data || [];
}

export function useGameTypesQuery(enabled = true) {
  return useQuery({
    queryKey: ["gameTypes"],
    queryFn: fetchGameTypes,
    enabled,
  });
}
