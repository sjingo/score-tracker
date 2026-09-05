"use client";

import { useQuery } from "@tanstack/react-query";

export interface XgBreakdown {
  type: string;
  label: string;
  value: number;
  count: number;
  xg: number;
}

export interface XgGameStats {
  gameId: string;
  oppositionName: string;
  matchDate: string;
  status: string;
  actualGoals: number;
  totalShots: number;
  totalXg: number;
  breakdown: XgBreakdown[];
}

async function fetchXgStats(): Promise<XgGameStats[]> {
  const response = await fetch("/api/stats/xg");
  const result = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || "Failed to load xG stats");
  }

  return result.data;
}

export function useXgStatsQuery() {
  return useQuery({
    queryKey: ["stats", "xg"],
    queryFn: fetchXgStats,
    staleTime: 30_000,
  });
}
