"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useXgStatsQuery } from "@/app/api/stats/useXgStatsQuery";
import { useGamesQuery } from "@/app/api/games/hooks/useGamesQuery";
import { useGameTypesQuery } from "@/app/api/game-types/hooks/useGameTypesQuery";
import SyncButton from "@/components/SyncButton";
import LoadingSpinner from "@/components/LoadingSpinner";
import LeaderboardStats, { LeaderboardEntry } from "@/components/LeaderboardStats";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import Alert from "@/components/Alert";
import Surface from "@/components/Surface";

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

function aggregateLeaderboard(
    entries: LeaderboardInput[],
    getValue: (entry: LeaderboardInput) => number | undefined,
): LeaderboardEntry[] {
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
    }, new Map<string, LeaderboardEntry>());

    return Array.from(totals.values()).sort((first, second) =>
        second.value - first.value || String(first.playerName).localeCompare(String(second.playerName)),
    );
}

export default function StatsView() {
    const queryClient = useQueryClient();
    const [selectedGameTypeId, setSelectedGameTypeId] = useState("");
    const [showOnlyGamesWithShots, setShowOnlyGamesWithShots] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
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
    } = useGamesQuery();
    const {
        data: gameTypes = [],
        isLoading: isLoadingGameTypes,
        error: gameTypesQueryError,
    } = useGameTypesQuery();

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["stats", "xg"] }),
                queryClient.invalidateQueries({ queryKey: ["games"] }),
                queryClient.invalidateQueries({ queryKey: ["gameTypes"] }),
            ]);
        } finally {
            setIsSyncing(false);
        }
    };
    const filteredGames = selectedGameTypeId
        ? games.filter((game) => game.gameTypeId === selectedGameTypeId)
        : games;
    const filteredGamesWithPlayerStats = selectedGameTypeId
        ? gamesWithPlayerStats.filter((game) => game.game_type_id === selectedGameTypeId)
        : gamesWithPlayerStats;
    const visibleGames = showOnlyGamesWithShots
        ? filteredGames.filter((game) => game.totalShots > 0)
        : filteredGames;
    const gamesWithShots = filteredGames.filter((game) => game.totalShots > 0);
    const totalXg = gamesWithShots.reduce((sum, game) => sum + game.totalXg, 0);
    const actualGoals = gamesWithShots.reduce((sum, game) => sum + game.actualGoals, 0);
    const totalShots = gamesWithShots.reduce((sum, game) => sum + game.totalShots, 0);
    const totalGoals = filteredGames.reduce((sum, game) => sum + game.actualGoals, 0);
    const averageGoals = filteredGames.length > 0 ? totalGoals / filteredGames.length : 0;
    const averageXg = gamesWithShots.length > 0 ? totalXg / gamesWithShots.length : 0;
    const averageShots = gamesWithShots.length > 0 ? totalShots / gamesWithShots.length : 0;
    const leaderboardStats = [
        {
            key: "scorers",
            title: "Scorers leaderboard",
            summaryLabel: "Goals",
            entries: aggregateLeaderboard(
                filteredGamesWithPlayerStats.flatMap((game) => game.scorers ?? []),
                (entry) => entry.goal_count,
            ),
        },
        {
            key: "assists",
            title: "Assists leaderboard",
            summaryLabel: "Assists",
            entries: aggregateLeaderboard(
                filteredGamesWithPlayerStats.flatMap((game) => game.assists ?? []),
                (entry) => entry.assist_count,
            ),
        },
        {
            key: "saves",
            title: "Saves leaderboard",
            summaryLabel: "Saves",
            entries: aggregateLeaderboard(
                filteredGamesWithPlayerStats.flatMap((game) => game.saves ?? []),
                (entry) => entry.save_count,
            ),
        },
    ].map((leaderboard) => ({
        ...leaderboard,
        totalValue: leaderboard.entries.reduce((total, entry) => total + entry.value, 0),
        playerCount: leaderboard.entries.length,
    }));

    if (isLoading || isLoadingPlayerStats || isLoadingGameTypes) {
        return <LoadingSpinner label="Loading stats..." className="mx-auto max-w-6xl" />;
    }

    const hasFatalError = (isError && games.length === 0)
        || (isPlayerStatsError && gamesWithPlayerStats.length === 0);
    const refreshError = xgQueryError?.message || playerStatsQueryError?.message || gameTypesQueryError?.message;

    if (hasFatalError) {
        return <PageContainer className="text-red-700">Failed to load xG stats.</PageContainer>;
    }

    return (
        <PageContainer>
            <PageHeader
                title="Stats"
                description={
                    <>
                        {refreshError && (
                            <Alert tone="warning" className="mb-4">
                                Refresh failed. Showing the last loaded stats. {refreshError}
                            </Alert>
                        )}
                        <p>Overview and details of all team xg and player stats.</p>
                    </>
                }
                actions={<SyncButton
                    onClick={handleSync}
                    disabled={isSyncing || isLoading || isLoadingPlayerStats || isLoadingGameTypes}
                    title="Refresh stats from server"
                    isSyncing={isSyncing}
                />}
            />

            <Surface variant="panel" className="mb-4 p-3 sm:mb-6 sm:p-4">
                <div>
                    <label htmlFor="stats-game-type" className="mb-2 block text-sm font-medium text-white">
                        Filter by Type
                    </label>
                    <select
                        id="stats-game-type"
                        value={selectedGameTypeId}
                        onChange={(event) => setSelectedGameTypeId(event.target.value)}
                        className="w-full rounded-lg border border-amber-200 px-2.5 py-1.5 text-gray-900 hover:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200 sm:px-3 sm:py-2"
                    >
                        <option value="">All Types</option>
                        {gameTypes.map((type) => (
                            <option key={type.id} value={type.id}>
                                {type.display_name}
                            </option>
                        ))}
                    </select>
                </div>
            </Surface>

            <Surface variant="panel" className="mb-4 p-4 sm:mb-6 sm:p-6">
                <h2 className="text-xl font-bold text-white sm:text-2xl">Average goals per game</h2>
                <div className="flex flex-wrap items-end justify-between gap-4 sm:gap-6">
                    <div className="text-right">
                        <p className="p-2 text-4xl font-bold tracking-tight text-amber-200 sm:text-5xl">{averageGoals.toFixed(2)}</p>
                    </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-blue-400 pt-3 text-sm text-white sm:mt-5 sm:gap-x-8 sm:pt-4">
                    <span>{filteredGames.length} games</span>
                    <span>{totalGoals} goals</span>
                </div>
            </Surface>

            <Surface variant="panel" className="mb-4 p-4 sm:mb-6 sm:p-6">
                <h2 className="text-xl font-bold text-white sm:text-2xl">Average xG per game</h2>
                <div className="flex flex-wrap items-end justify-between gap-4 sm:gap-6">
                    <div className="text-right">
                        <p className="p-2 text-4xl font-bold tracking-tight text-amber-200 sm:text-5xl">{averageXg.toFixed(2)}</p>
                    </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-blue-400 pt-3 text-sm text-white sm:mt-5 sm:gap-x-8 sm:pt-4">
                    <span>{gamesWithShots.length} games</span>
                    <span>{totalShots} shots</span>
                    <span>{averageShots.toFixed(1)} shots p/g</span>
                    <span>{totalXg.toFixed(2)} xG</span>
                </div>
            </Surface>

            <LeaderboardStats
                leaderboards={leaderboardStats}
            />

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
                <Surface className="p-4 text-center text-gray-500 sm:p-6">
                    {showOnlyGamesWithShots ? "No games with recorded shots found." : "No games found."}
                </Surface>
            ) : (
                <div className="space-y-4 sm:space-y-6">
                    {visibleGames.map((game) => (
                        <Surface key={game.gameId} className="p-4 sm:p-6">
                            <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-3 sm:gap-4 sm:pb-4">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">Lions vs {game.oppositionName}</h2>
                                    <p className="text-sm text-gray-500">{formatDate(game.matchDate)} · {game.status}</p>
                                </div>
                                <div className="flex gap-4 text-right sm:gap-6">
                                    <div>
                                        <div className="text-sm text-gray-500">xG</div>
                                        <div className="text-2xl font-bold text-blue-600 sm:text-3xl">{game.totalXg.toFixed(2)}</div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-500">Actual goals</div>
                                        <div className="text-2xl font-bold text-green-600 sm:text-3xl">{game.actualGoals}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-3 grid gap-2 sm:mt-4 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
                                {game.breakdown.map((item) => (
                                    <div key={item.type} className="rounded border border-salts-blue p-3 sm:p-4">
                                        <div className="font-semibold text-gray-900">{item.label}</div>
                                        <div className="mt-2 text-sm text-gray-600">
                                            {item.count} shots × {item.value.toFixed(2)}
                                        </div>
                                        <div className="mt-1 text-lg font-bold text-gray-900">= {item.xg.toFixed(2)} xG</div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 border-t pt-3 text-sm text-gray-600 sm:mt-4 sm:gap-x-6 sm:pt-4">
                                <span>{game.totalShots} total shots</span>
                                <span>Goals minus xG: <strong className="text-gray-900">{(game.actualGoals - game.totalXg).toFixed(2)}</strong></span>
                            </div>
                        </Surface>
                    ))}
                </div>
            )}
        </PageContainer>
    );
}