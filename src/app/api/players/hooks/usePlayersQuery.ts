"use client";

import { useQuery } from "@tanstack/react-query";

export interface Player {
  id: string;
  name: string;
  jersey_number: number | null;
  anonymised_id: string;
}

async function fetchPlayers(): Promise<Player[]> {
  const response = await fetch("/api/players");
  const data = await response.json();
  return data.data || [];
}

export function usePlayersQuery() {
  return useQuery({
    queryKey: ["players"],
    queryFn: fetchPlayers,
    staleTime: 30_000,
  });
}
