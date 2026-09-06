"use client";

import { useQuery } from "@tanstack/react-query";
import { Game } from "@/components/types";

async function fetchGames(): Promise<Game[]> {
  const response = await fetch("/api/games");
  const data = await response.json();
  return data.data || [];
}

export function useGamesQuery(initialData?: Game[], enabled = true) {
  return useQuery({
    queryKey: ["games"],
    queryFn: fetchGames,
    initialData,
    enabled,
  });
}
