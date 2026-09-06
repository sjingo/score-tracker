"use client";

import { useQuery } from "@tanstack/react-query";
import { Player } from "@/components/types";

async function fetchPlayers(): Promise<Player[]> {
  const response = await fetch("/api/players");
  const data = await response.json();
  return data.data || [];
}

export function usePlayersQuery() {
  return useQuery({
    queryKey: ["players"],
    queryFn: fetchPlayers,
  });
}
