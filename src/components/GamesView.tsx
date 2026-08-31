"use client";

import { useEffect, useState, useMemo } from "react";
import { Game, Player, GameType, OPPOSITION_GOAL } from './types'



export default function GamesView() {
    const [games, setGames] = useState<Game[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [gameTypes, setGameTypes] = useState<GameType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form states
    const [newGame, setNewGame] = useState({
        oppositionName: "",
        gameTypeId: "",
        venue: "",
        notes: "",
        location: "",
    });

    const [selectedGame, setSelectedGame] = useState<string | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
    const [goalCount, setGoalCount] = useState(1);
    const [scoringError, setError2] = useState<string | null>(null);

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [gamesRes, playersRes, typesRes] = await Promise.all([
                    fetch("/api/games"),
                    fetch("/api/players"),
                    fetch("/api/game-types"),
                ]);

                const gamesData = await gamesRes.json();
                const playersData = await playersRes.json();
                const typesData = await typesRes.json();



                setGames(gamesData.data || []);
                setPlayers(playersData.data || []);
                setGameTypes(typesData.data || []);
            } catch (err) {
                console.error("[GamesView] Fetch error:", err);
                setError(String(err));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleCreateGame = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const res = await fetch("/api/games", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newGame),
            });

            const result = await res.json();

            if (result.success) {
                setGames([result.data, ...games]);
                setNewGame({
                    oppositionName: "",
                    gameTypeId: "",
                    venue: "",
                    notes: "",
                    location: "",
                });
            } else {
                console.error("[GamesView] Failed to create game:", result.error);
                setError(result.error);
            }
        } catch (err) {
            console.error("[GamesView] Create game error:", err);
            setError(String(err));
        }
    };

    const handleRecordGoal = async (gameId: string) => {

        if (selectedPlayer === OPPOSITION_GOAL) {
            try {
                const res = await fetch(`/api/games/${gameId}/opposition-goal`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        goalCount: goalCount,
                    }),

                });
                const result = await res.json();

                if (result.success) {
                    // Refresh the games list to get updated scores
                    const gamesRes = await fetch("/api/games");
                    const gamesData = await gamesRes.json();
                    setGames(gamesData.data || []);
                    setSelectedPlayer(null);
                    setGoalCount(1);
                    setError2(null);
                } else {
                    console.error("[GamesView] Failed to record opposition goal:", result.error);
                    setError2(result.error);
                }
            } catch (err) {
                console.error("[GamesView] Record opposition goal error:", err);
                setError2(String(err));
            }
            return;
        }


        if (!selectedPlayer) {
            console.warn("[GamesView] No player selected");
            setError2("Please select a player");
            return;
        }

        try {
            const player = players.find((p) => p.id === selectedPlayer);
            if (!player) {
                console.warn("[GamesView] Player not found");
                setError2("Player not found");
                return;
            }

            const res = await fetch(`/api/games/${gameId}/scores`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    playerId: selectedPlayer,
                    playerName: player.name,
                    playerNumber: player.jersey_number,
                    goalCount: goalCount,
                }),
            });

            const result = await res.json();

            if (result.success) {
                const gamesRes = await fetch("/api/games");
                const gamesData = await gamesRes.json();
                setGames(gamesData.data || []);
                setSelectedPlayer(null);
                setGoalCount(1);
                setError2(null);
            } else {
                console.error("[GamesView] Failed to record goal:", result.error);
                setError2(result.error);
            }
        } catch (err) {
            console.error("[GamesView] Record goal error:", err);
            setError2(String(err));
        }
    };

    const handleDeleteScorer = async (gameId: string, scorerId: string) => {

        if (!window.confirm("Are you sure you want to delete this game?")) {
            return;
        }

        try {
            const res = await fetch(`/api/games/${gameId}/scores`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scorerId }),
            });

            const result = await res.json();

            if (result.success) {
                console.log("[GamesView] Scorer deleted:", result.data);
                // Refresh the games list
                const gamesRes = await fetch("/api/games");
                const gamesData = await gamesRes.json();
                setGames(gamesData.data || []);
            } else {
                console.error("[GamesView] Failed to delete scorer:", result.error);
                setError2(result.error);
            }
        } catch (err) {
            console.error("[GamesView] Delete scorer error:", err);
            setError2(String(err));
        }
    };

    const handleDeleteGame = async (gameId: string) => {
        console.log(`[GamesView] Deleting game ${gameId}`);

        if (!window.confirm("Are you sure you want to delete this game?")) {
            return;
        }

        try {
            const res = await fetch(`/api/games/${gameId}`, {
                method: "DELETE",
            });

            const result = await res.json();

            if (result.success) {
                console.log("[GamesView] Game deleted");
                setGames(games.filter((g) => g.id !== gameId));
            } else {
                console.error("[GamesView] Failed to delete game:", result.error);
                setError(result.error);
            }
        } catch (err) {
            console.error("[GamesView] Delete game error:", err);
            setError(String(err));
        }
    };

    const handleUpdateGameStatus = async (gameId: string, newStatus: string) => {
        console.log(`[GamesView] Updating game ${gameId} status to ${newStatus}`);

        try {
            const res = await fetch(`/api/games/${gameId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            const result = await res.json();

            if (result.success) {
                console.log("[GamesView] Game status updated");
                setGames(
                    games.map((g) => (g.id === gameId ? { ...g, status: newStatus } : g))
                );
            } else {
                console.error("[GamesView] Failed to update game:", result.error);
                setError(result.error);
            }
        } catch (err) {
            console.error("[GamesView] Update game error:", err);
            setError(String(err));
        }
    };
    console.log('selectedGame', selectedGame)
    const activeGames = games.filter((g) => g.status === "in-progress");
    const completedGames = games.filter((g) => g.status === "completed");
    const activePlayers = useMemo(() => [{ id: OPPOSITION_GOAL, jersey_number: '0', name: 'Opposition Goal', is_active: true }, ...players.filter((p) => p.is_active)], [players]);

    if (loading)
        return (
            <div className="p-2 text-center text-lg font-semibold">Loading...</div>
        );

    return (
        <div className="max-w-6xl mx-auto p-2">
            <h1 className="text-4xl font-bold mb-2">🦁 Lions Games</h1>
            <p className="text-gray-600 mb-6">
                Total: {games.length} | In Progress: {activeGames.length} | Completed:{" "}
                {completedGames.length}
            </p>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {/* New Game Form */}
            <div className="bg-white p-4 rounded-lg shadow-md mb-6 border-l-4 border-green-500">
                <h2 className="text-2xl font-bold mb-4">➕ Create New Game</h2>
                <form onSubmit={handleCreateGame} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Opposition Name (required)"
                            value={newGame.oppositionName}
                            onChange={(e) =>
                                setNewGame({ ...newGame, oppositionName: e.target.value })
                            }
                            required
                            className="border p-3 rounded bg-gray-50"
                        />
                        <select
                            value={newGame.gameTypeId}
                            onChange={(e) =>
                                setNewGame({ ...newGame, gameTypeId: e.target.value })
                            }
                            required
                            className="border p-3 rounded bg-gray-50"
                        >
                            <option value="">Select Game Type (required)</option>
                            {gameTypes.map((type) => (
                                <option key={type.id} value={type.id}>
                                    {type.display_name}
                                </option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder="Venue (optional)"
                            value={newGame.venue}
                            onChange={(e) => setNewGame({ ...newGame, venue: e.target.value })}
                            className="border p-3 rounded bg-gray-50"
                        />
                        <select
                            value={newGame.location}
                            onChange={(e) =>
                                setNewGame({ ...newGame, location: e.target.value })
                            }
                            className="border p-3 rounded bg-gray-50"
                        >
                            <option value="">Select Location (optional)</option>
                            <option value="home">🏠 Home</option>
                            <option value="away">🚗 Away</option>
                        </select>
                    </div>
                    <textarea
                        placeholder="Notes (optional)"
                        value={newGame.notes}
                        onChange={(e) => setNewGame({ ...newGame, notes: e.target.value })}
                        className="border p-3 rounded w-full bg-gray-50"
                        rows={2}
                    />
                    <button
                        type="submit"
                        className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 font-semibold"
                    >
                        Create Game
                    </button>
                </form>
            </div>

            {/* In Progress Games */}
            {activeGames.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">🔴 In Progress ({activeGames.length})</h2>
                    <div className="space-y-4">
                        {activeGames.map((game) => (
                            <div
                                key={game.id}
                                className="bg-white p-4 rounded-lg shadow-md border-l-4 border-yellow-500"
                            >
                                {/* Game Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-2xl font-bold">
                                            🦁 Lions vs {game.opposition_name}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {new Date(game.match_date).toLocaleDateString()} •{" "}
                                            <span
                                                className="inline-block px-2 py-1 rounded text-white text-xs font-semibold"
                                                style={{
                                                    backgroundColor: game.game_type_color || "#3b82f6",
                                                }}
                                            >
                                                {game.game_type_display}
                                            </span>
                                            {game.location && (
                                                <span className="ml-2">
                                                    {game.location === "home" ? "🏠" : "🚗"}{" "}
                                                    {game.location.charAt(0).toUpperCase() + game.location.slice(1)}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleUpdateGameStatus(game.id, "completed")}
                                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm"
                                    >
                                        Mark Complete
                                    </button>
                                </div>

                                {/* Score Display */}
                                <div className="bg-blue-50 p-2 rounded mb-4 border-2 border-blue-200">
                                    <div className="text-center">
                                        <div className="text-4xl font-bold text-blue-900">
                                            {game.score_for} - {game.score_against}
                                        </div>
                                        <div className="text-sm text-blue-600 mt-1">Goals For - Against</div>
                                    </div>
                                </div>

                                {/* Scorers List */}
                                <div className="mb-4">
                                    <h4 className="font-semibold mb-2">Scorers:</h4>
                                    {game.scorers && game.scorers.length > 0 ? (
                                        <div className="space-y-2">
                                            {game.scorers.map((scorer) => (
                                                <div
                                                    key={scorer.id}
                                                    className="flex justify-between items-center bg-gray-100 p-3 rounded"
                                                >
                                                    <span>
                                                        {scorer.player_name}{" "}
                                                        <span className="text-gray-500 text-sm">
                                                            ({scorer.anonymised_id})
                                                        </span>
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold bg-blue-500 text-white px-3 py-1 rounded">
                                                            {scorer.goal_count}
                                                        </span>
                                                        <button
                                                            onClick={() =>
                                                                handleDeleteScorer(game.id, scorer.id)
                                                            }
                                                            className="text-red-600 hover:text-red-900 text-sm"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-gray-500 italic">No scorers yet</p>
                                    )}
                                </div>

                                {/* Record Goal Form */}
                                <div className="bg-gray-50 p-2 rounded">
                                    <h4 className="font-semibold mb-3">⚽ Record Goal:</h4>
                                    {scoringError && (
                                        <div className="bg-red-100 text-red-700 p-2 rounded mb-2 text-sm">
                                            {scoringError}
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <select
                                            value={selectedGame === game.id ? selectedPlayer || "" : ""}
                                            onChange={(e) => {
                                                setSelectedGame(game.id);
                                                setSelectedPlayer(e.target.value);
                                            }}
                                            className="flex-1 border p-2 rounded bg-white"
                                        >
                                            <option value="">Select player...</option>
                                            {activePlayers.map((player) => {

                                                return (
                                                    <option key={player.id} value={player.id}>
                                                        {player.name}
                                                        {player.jersey_number ? ` (#${player.jersey_number})` : ""}
                                                    </option>
                                                )
                                            })}
                                        </select>
                                        <input
                                            type="number"
                                            min={- 99}
                                            max={99}
                                            value={goalCount}
                                            onChange={(e) => setGoalCount(parseInt(e.target.value))}
                                            className="w-16 border p-2 rounded"
                                        />
                                        <button
                                            onClick={() => handleRecordGoal(game.id)}
                                            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold"
                                        >
                                            Add Goal
                                        </button>
                                    </div>
                                </div>

                                {/* Delete Game Button */}
                                <div className="mt-4 flex justify-end">
                                    <button
                                        onClick={() => handleDeleteGame(game.id)}
                                        className="text-red-600 hover:text-red-900 text-sm underline"
                                    >
                                        Delete Game
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Completed Games */}
            {completedGames.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-2xl font-bold mb-4">✅ Completed ({completedGames.length})</h2>
                    <div className="space-y-3">
                        {completedGames.map((game) => (
                            <div
                                key={game.id}
                                className="bg-gray-100 p-2 rounded-lg shadow border-l-4 border-gray-500"
                            >
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="font-semibold">
                                            Lions vs {game.opposition_name}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {new Date(game.match_date).toLocaleDateString()} • {game.game_type_display}
                                        </p>
                                    </div>
                                    <div className="text-2xl font-bold">{game.score_for} - {game.score_against}</div>
                                    <button
                                        onClick={() => handleUpdateGameStatus(game.id, "in-progress")}
                                        className="text-blue-600 hover:text-blue-900 text-sm"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDeleteGame(game.id)}
                                        className="text-red-600 hover:text-red-900 text-sm"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {games.length === 0 && (
                <div className="bg-gray-100 p-6 rounded-lg text-center text-gray-600">
                    <p className="text-lg">No games yet. Create one above to get started!</p>
                </div>
            )}
        </div>
    );
}
