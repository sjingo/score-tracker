"use client";

import { useQuery } from "@tanstack/react-query";
import { Team } from "@/components/types";

async function fetchTeams(): Promise<Team[]> {
  const response = await fetch("/api/teams");
  const data = await response.json();
  return data.data || [];
}

export function useTeamsQuery() {
  return useQuery({
    queryKey: ["teams"],
    queryFn: fetchTeams,
  });
}
