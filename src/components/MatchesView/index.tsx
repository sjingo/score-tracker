"use client";

import { useState, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGamesQuery } from "@/app/api/games/hooks/useGamesQuery";
import { useGameTypesQuery } from "@/app/api/game-types/hooks/useGameTypesQuery";
import { SyncIcon } from "@/icons/sync";
import LeagueTable from './LeagueTable';
import MatchResults from './MatchResults';
import MatchForm from '@/components/MatchesView/MatchForm';
import StatsSummary from './StatsSummary';

interface MatchesViewProps {
    isActive?: boolean;
}

export default function MatchesView({ isActive = true }: MatchesViewProps) {
    const queryClient = useQueryClient();
    // React Query hooks - data fetched with 10 minute stale time
    const {
        data: games = [],
        isLoading: gamesLoading,
        isError: gamesError,
        error: gamesQueryError,
    } = useGamesQuery(undefined, isActive);
    const {
        data: gameTypes = [],
        isLoading: typesLoading,
        isError: gameTypesError,
        error: gameTypesQueryError,
    } = useGameTypesQuery(isActive);

    // Local state for UI interactions
    const [selectedGameTypeId, setSelectedGameTypeId] = useState<string | null>(null);
    const [oppositionSearch, setOppositionSearch] = useState('');
    const [isSyncing, setIsSyncing] = useState(false);

    const loading = gamesLoading || typesLoading;
    const error = gamesQueryError?.message || gameTypesQueryError?.message;

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: ["games"] }),
                queryClient.invalidateQueries({ queryKey: ["gameTypes"] }),
            ]);
        } finally {
            setIsSyncing(false);
        }
    };

    const filteredGames = useMemo(() => {
        const normalizedSearch = oppositionSearch.trim().toLowerCase();

        return games.filter((game) => {
            const matchesType = !selectedGameTypeId || game.game_type_id === selectedGameTypeId;
            const matchesOpposition = !normalizedSearch || game.opposition_name.toLowerCase().includes(normalizedSearch);

            return matchesType && matchesOpposition;
        });
    }, [games, oppositionSearch, selectedGameTypeId]);

    // Group filtered games by game type if a filter is selected
    const displayData = useMemo(() => {
        if (!selectedGameTypeId) {
            // Show all games in one table, sorted chronologically
            return [
                {
                    gameType: null,
                    matches: filteredGames,
                },
            ];
        }

        // Group by game type
        const gameType = gameTypes.find((gt) => gt.id === selectedGameTypeId);
        if (!gameType) return [];

        return [
            {
                gameType,
                matches: filteredGames,
            },
        ];
    }, [filteredGames, gameTypes, selectedGameTypeId]);

    const completedGames = [...games]
        .filter((game) => game.status === 'completed')
        .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime());

    const filteredCompletedGames = useMemo(() => selectedGameTypeId
        ? completedGames.filter((game) => game.game_type_id === selectedGameTypeId)
        : completedGames, [completedGames, selectedGameTypeId]);

    const filteredGoalsFor = filteredCompletedGames.reduce((sum, game) => sum + game.score_for, 0);
    const filteredGoalsAgainst = filteredCompletedGames.reduce((sum, game) => sum + game.score_against, 0);

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="text-center text-gray-500">Loading matches...</div>
            </div>
        );
    }

    if (gamesError || gameTypesError) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">
                    {error || "Failed to load matches."}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between gap-4">
                <h1 className="text-3xl font-bold text-gray-900">📊 Match Results</h1>
                <button
                    onClick={handleSync}
                    disabled={isSyncing || loading}
                    className="inline-flex items-center gap-2 rounded p-2 text-white disabled:opacity-60"
                    title="Refresh matches from server"
                >
                    <SyncIcon className={` stroke-salts-blue size-10 ${isSyncing ? "animate-spin" : ""}`} />
                    {isSyncing}
                </button>
            </div>

            <div className="mb-6">
                {error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                {/* Filters */}
                <div className="bg-salts-blue rounded-lg shadow p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Game Type Filter */}
                        <div>
                            <label className="block text-sm font-medium text-amber-200 mb-2">
                                Filter by Type
                            </label>
                            <select
                                value={selectedGameTypeId || ''}
                                onChange={(e) => setSelectedGameTypeId(e.target.value || null)}
                                className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-white text-gray-900 hover:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200"
                            >
                                <option value="">All Types</option>
                                {gameTypes.map((type) => (
                                    <option key={type.id} value={type.id}>
                                        {type.display_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Opposition Filter */}
                        <div>
                            <label htmlFor="opposition-search" className="block text-sm font-medium text-amber-200 mb-2">
                                Search Opposition
                            </label>
                            <input
                                id="opposition-search"
                                type="search"
                                value={oppositionSearch}
                                onChange={(e) => setOppositionSearch(e.target.value)}
                                placeholder="Search by opposition name"
                                className="w-full px-3 py-2 border border-amber-200 rounded-lg bg-white text-gray-900 placeholder:text-gray-400 hover:border-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200"
                            />
                        </div>
                    </div>
                </div>

                {/* Stats Summary */}
                <StatsSummary
                    completedGames={filteredCompletedGames.length}
                    goalsFor={filteredGoalsFor}
                    goalsAgainst={filteredGoalsAgainst}
                >
                    <MatchForm matches={filteredGames} />
                </StatsSummary>
            </div>

            {/* Tables and Results */}
            <div className="space-y-8">
                {displayData.length === 0 ? (
                    <div className="p-6 bg-gray-50 rounded-lg text-center text-gray-500">
                        No matches found
                    </div>
                ) : (
                    displayData.map((section, idx) => (
                        <div key={idx} className="space-y-4">
                            <LeagueTable
                                matches={section.matches}
                                gameType={section.gameType || undefined}
                            />
                            <MatchResults
                                matches={section.matches}
                                gameType={section.gameType || undefined}
                            />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
