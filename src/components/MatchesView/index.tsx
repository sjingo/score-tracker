"use client";

import { useEffect, useState, useMemo } from "react";
import { Game, GameType } from '../types';
import LeagueTable from './LeagueTable';
import MatchResults from './MatchResults';

export default function MatchesView() {
    const [games, setGames] = useState<Game[]>([]);
    const [gameTypes, setGameTypes] = useState<GameType[]>([]);
    const [selectedGameTypeId, setSelectedGameTypeId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [gamesRes, typesRes] = await Promise.all([
                    fetch("/api/games"),
                    fetch("/api/game-types"),
                ]);

                const gamesData = await gamesRes.json();
                const typesData = await typesRes.json();

                // Handle both response structures
                const games = gamesData.data || gamesData;
                const types = typesData.data || typesData;

                setGames(games);
                setGameTypes(types);
                setError(null);
            } catch (err) {
                setError("Failed to load matches");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Group games by game type if a filter is selected
    const displayData = useMemo(() => {
        if (!selectedGameTypeId) {
            // Show all games in one table, sorted chronologically
            return [
                {
                    gameType: null,
                    matches: games,
                },
            ];
        }

        // Group by game type
        const gameType = gameTypes.find((gt) => gt.id === selectedGameTypeId);
        if (!gameType) return [];

        return [
            {
                gameType,
                matches: games.filter(
                    (g) => g.game_type_id === selectedGameTypeId
                ),
            },
        ];
    }, [games, gameTypes, selectedGameTypeId]);

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="text-center text-gray-500">Loading matches...</div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">📊 Match Results</h1>

                {error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-lg mb-4">
                        {error}
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Game Type Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Filter by Type
                            </label>
                            <select
                                value={selectedGameTypeId || ''}
                                onChange={(e) => setSelectedGameTypeId(e.target.value || null)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Types</option>
                                {gameTypes.map((type) => (
                                    <option key={type.id} value={type.id}>
                                        {type.display_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-gray-600 text-sm">Completed Matches</div>
                        <div className="text-2xl font-bold text-gray-900">
                            {games.filter((g) => g.status === 'completed').length}
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-gray-600 text-sm">Total Goals For</div>
                        <div className="text-2xl font-bold text-green-600">
                            {games.reduce((sum, g) => sum + g.score_for, 0)}
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-4">
                        <div className="text-gray-600 text-sm">Total Goals Against</div>
                        <div className="text-2xl font-bold text-red-600">
                            {games.reduce((sum, g) => sum + g.score_against, 0)}
                        </div>
                    </div>
                </div>
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
