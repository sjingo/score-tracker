"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useXgStatsQuery } from "@/app/api/stats/useXgStatsQuery";
import { useGamesQuery } from "@/app/api/games/hooks/useGamesQuery";
import { Game } from "@/components/types";
import { SyncIcon } from "@/icons/sync";

function formatDate(value: string) {
    return new Date(`${value.slice(0, 10)}T00:00:00Z`).toLocaleDateString();
}

type LeaderboardInput = {
    player_id: string;
    player_name?: string;
    anonymised_id?: string;
    goal_count?: number;
    assist_count?: number;
    save_count?: number;
};

type LeaderboardRow = {
    playerId: string;
    playerName: string;
    value: number;
};

function aggregateLeaderboard(
    entries: LeaderboardInput[],
    getValue: (entry: LeaderboardInput) => number | undefined,
): LeaderboardRow[] {
    const totals = entries.reduce((result, entry) => {
        const value = Number(getValue(entry));
        if (value <= 0) return result;

        const current = result.get(entry.player_id);
        result.set(entry.player_id, {
            playerId: entry.player_id,
            playerName: current?.playerName ?? entry.player_name ?? entry.anonymised_id ?? "Unknown player",
            value: (current?.value ?? 0) + value,
        });
        return result;
    }, new Map<string, LeaderboardRow>());

    return Array.from(totals.values()).sort((first, second) =>
        second.value - first.value || String(first.playerName).localeCompare(String(second.playerName)),
    );
}

export default function StatsView({ initialGames }: { initialGames?: Game[] }) {
    const queryClient = useQueryClient();
    const [showOnlyGamesWithShots, setShowOnlyGamesWithShots] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [expandedLeaderboards, setExpandedLeaderboards] = useState<Record<string, boolean>>({
        scorers: true,
        assists: true,
        saves: true,
    });
    const {
        data: games = [],
        isLoading,
        isError,
        error: xgQueryError,
    } = useXgStatsQuery();
    const {
        data: gamesWithPlayerStats = [],
        isLoading: isLoadingPlayerStats,
        isError: isPlayerStatsError,
        error: playerStatsQueryError,
    } = useGamesQuery(initialGames);

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["stats", "xg"] }),
                queryClient.invalidateQueries({ queryKey: ["games"] }),
            ]);
        } finally {
            setIsSyncing(false);
        }
    };
    const visibleGames = showOnlyGamesWithShots
        ? games.filter((game) => game.totalShots > 0)
        : games;
    const gamesWithShots = games.filter((game) => game.totalShots > 0);
    const totalXg = gamesWithShots.reduce((sum, game) => sum + game.totalXg, 0);
    const actualGoals = gamesWithShots.reduce((sum, game) => sum + game.actualGoals, 0);
    const totalShots = gamesWithShots.reduce((sum, game) => sum + game.totalShots, 0);
    const averageXg = gamesWithShots.length > 0 ? totalXg / gamesWithShots.length : 0;
    const averageShots = gamesWithShots.length > 0 ? totalShots / gamesWithShots.length : 0;
    const leaderboardStats = [
        {
            key: "scorers",
            title: "Scorers leaderboard",
            summaryLabel: "Goals",
            entries: aggregateLeaderboard(
                gamesWithPlayerStats.flatMap((game) => game.scorers ?? []),
                (entry) => entry.goal_count,
            ),
        },
        {
            key: "assists",
            title: "Assists leaderboard",
            summaryLabel: "Assists",
            entries: aggregateLeaderboard(
                gamesWithPlayerStats.flatMap((game) => game.assists ?? []),
                (entry) => entry.assist_count,
            ),
        },
        {
            key: "saves",
            title: "Saves leaderboard",
            summaryLabel: "Saves",
            entries: aggregateLeaderboard(
                gamesWithPlayerStats.flatMap((game) => game.saves ?? []),
                (entry) => entry.save_count,
            ),
        },
    ].map((leaderboard) => ({
        ...leaderboard,
        totalValue: leaderboard.entries.reduce((total, entry) => total + entry.value, 0),
        playerCount: leaderboard.entries.length,
    }));

    const toggleLeaderboard = (key: string) => {
        setExpandedLeaderboards((current) => ({
            ...current,
            [key]: !current[key],
        }));
    };

    if (isLoading || isLoadingPlayerStats) {
        return <div className="max-w-6xl mx-auto px-4 py-8 text-gray-500">Loading stats...</div>;
    }

    const hasFatalError = (isError && games.length === 0)
        || (isPlayerStatsError && gamesWithPlayerStats.length === 0);
    const refreshError = xgQueryError?.message || playerStatsQueryError?.message;

    if (hasFatalError) {
        return <div className="max-w-6xl mx-auto px-4 py-8 text-red-700">Failed to load xG stats.</div>;
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="mb-6 flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Stats</h1>

                    {refreshError && (
                        <div className="mb-6 rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                            Refresh failed. Showing the last loaded stats. {refreshError}
                        </div>
                    )}
                    <p className="mt-2 text-gray-600">Overview and details of all team xg and player stats.</p>
                </div>
                <button
                    onClick={handleSync}
                    disabled={isSyncing || isLoading}
                    className="mt-1 inline-flex items-center gap-2 rounded bg-salts-blue p-2 text-white hover:bg-blue-700 disabled:opacity-60"
                    title="Refresh stats from server"
                >
                    <SyncIcon className={`size-5 ${isSyncing ? "animate-spin" : ""}  stroke-amber-200`} />
                    {isSyncing}
                </button>
            </div>

            <section className="mb-6 rounded-lg bg-salts-blue p-6 text-white shadow">
                <div className="flex flex-wrap items-end justify-between gap-6">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-wide text-amber-200">All recorded shot games</p>
                        <p className="mt-1 text-sm text-blue-100">Games without shots are excluded from this total.</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-blue-100">Average xG per game</p>
                        <p className="text-5xl font-bold tracking-tight">{averageXg.toFixed(2)}</p>
                    </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2 border-t border-blue-400 pt-4 text-sm text-blue-100">
                    <span>{gamesWithShots.length} games</span>
                    <span>{totalShots} shots</span>
                    <span>{averageShots.toFixed(1)} shots per game</span>
                    <span>{totalXg.toFixed(2)} total xG</span>
                    <span>{actualGoals} actual goals</span>
                    <span>Goals minus xG: <strong className="text-white">{(actualGoals - totalXg).toFixed(2)}</strong></span>
                </div>
            </section>

            <section className="mb-6 rounded-lg bg-salts-blue p-6 text-white shadow">
                <div className="mb-5">
                    <h2 className="text-2xl font-bold text-white">Player stats</h2>
                    <p className="mt-1 text-blue-100">Recorded player contributions across all games.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                    {leaderboardStats.map((leaderboard) => (
                        <div key={leaderboard.key} className="border-l-4 border-amber-200 pl-4">
                            <p className="text-sm font-semibold uppercase tracking-wide text-amber-200">{leaderboard.summaryLabel}</p>
                            <p className="mt-1 text-3xl font-bold text-white">{leaderboard.totalValue}</p>
                            <p className="text-sm text-blue-100">across {leaderboard.playerCount} players</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mb-6 grid gap-4 lg:grid-cols-3">
                {leaderboardStats.map((leaderboard) => (
                    <section key={leaderboard.key} className="rounded-lg bg-white p-5 shadow">
                        <button
                            type="button"
                            onClick={() => toggleLeaderboard(leaderboard.key)}
                            aria-expanded={expandedLeaderboards[leaderboard.key]}
                            className="flex w-full items-center justify-between gap-3 text-left"
                        >
                            <span>
                                <span className="block text-xl font-semibold text-gray-900">{leaderboard.title}</span>
                                <span className="mt-1 block text-sm text-gray-500">{leaderboard.playerCount} players · {leaderboard.totalValue} total</span>
                            </span>
                            <span className="text-xl text-gray-500" aria-hidden="true">{expandedLeaderboards[leaderboard.key] ? "−" : "+"}</span>
                        </button>
                        {expandedLeaderboards[leaderboard.key] && (
                            <div className="mt-4 border-t border-gray-100 pt-4">
                                {leaderboard.entries.length === 0 ? (
                                    <p className="text-sm italic text-gray-500">No players with recorded stats.</p>
                                ) : (
                                    <ol className="space-y-3">
                                        {leaderboard.entries.map((entry, index) => (
                                            <li key={entry.playerId} className="flex items-center justify-between gap-3 border-b border-gray-100 pb-2 last:border-0 last:pb-0">
                                                <span className="flex min-w-0 items-center gap-3">
                                                    <span className="w-5 text-sm font-semibold text-gray-400">{index + 1}</span>
                                                    <span className="truncate text-gray-800">{entry.playerName}</span>
                                                </span>
                                                <span className="shrink-0 font-bold text-salts-blue">{entry.value}</span>
                                            </li>
                                        ))}
                                    </ol>
                                )}
                            </div>
                        )}
                    </section>
                ))}
            </section>

            <label className="mb-6 flex items-center gap-3 text-sm text-gray-700">
                <input
                    type="checkbox"
                    checked={showOnlyGamesWithShots}
                    onChange={(event) => setShowOnlyGamesWithShots(event.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-salts-blue"
                />
                Only show games with recorded shots
            </label>

            {visibleGames.length === 0 ? (
                <div className="rounded-lg bg-white p-6 text-center text-gray-500 shadow">
                    {showOnlyGamesWithShots ? "No games with recorded shots found." : "No games found."}
                </div>
            ) : (
                <div className="space-y-6">
                    {visibleGames.map((game) => (
                        <section key={game.gameId} className="rounded-lg bg-white p-6 shadow">
                            <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">Lions vs {game.oppositionName}</h2>
                                    <p className="text-sm text-gray-500">{formatDate(game.matchDate)} · {game.status}</p>
                                </div>
                                <div className="flex gap-6 text-right">
                                    <div>
                                        <div className="text-sm text-gray-500">xG</div>
                                        <div className="text-3xl font-bold text-blue-600">{game.totalXg.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500">Actual goals</div>
                                        <div className="text-3xl font-bold text-green-600">{game.actualGoals}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                {game.breakdown.map((item) => (
                                    <div key={item.type} className="rounded border border-salts-blue p-4">
                                        <div className="font-semibold text-gray-900">{item.label}</div>
                                        <div className="mt-2 text-sm text-gray-600">
                                            {item.count} shots × {item.value.toFixed(2)}
                                        </div>
                                        <div className="mt-1 text-lg font-bold text-gray-900">= {item.xg.toFixed(2)} xG</div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t pt-4 text-sm text-gray-600">
                                <span>{game.totalShots} total shots</span>
                                <span>Goals minus xG: <strong className="text-gray-900">{(game.actualGoals - game.totalXg).toFixed(2)}</strong></span>
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </div>
    );
}