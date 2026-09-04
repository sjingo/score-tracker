"use client";

import { useEffect, useState, useMemo } from "react";
import { Game, Player, GameType, Team, OPPOSITION_GOAL } from '../types'
import { useGameGoalMutation } from "@/app/api/games/hooks/useGameGoalMutation";
import { useGameAssistMutation } from "@/app/api/games/hooks/useGameAssistMutation";
import { useGameDateMutation } from "@/app/api/games/hooks/useGameDateMutation";
import { useGameTypeMutation } from "@/app/api/games/hooks/useGameTypeMutation";
import { useGameLocationMutation } from "@/app/api/games/hooks/useGameLocationMutation";
import ScorersPanel from "./ScorersPanel";
import AssistsPanel from "./AssistsPanel";
import GameDatePicker from "./GameDatePicker";
import GameTypeSelect from "./GameTypeSelect";
import LocationSelect from "./LocationSelect";



export default function GamesView() {
    const [games, setGames] = useState<Game[]>([]);
    const [players, setPlayers] = useState<Player[]>([]);
    const [gameTypes, setGameTypes] = useState<GameType[]>([]);
    const [oppositionTeams, setOppositionTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [addingTeam, setAddingTeam] = useState(false);
    const [newTeamName, setNewTeamName] = useState("");

    // Form states
    const [newGame, setNewGame] = useState({
        oppositionTeamId: "",
        oppositionName: "",
        gameTypeId: "",
        venue: "",
        notes: "",
        location: "",
    });

    const [selectedGame, setSelectedGame] = useState<string | null>(null);
    const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
    const [scoringError, setError2] = useState<string | null>(null);

    // Assist tracking states
    const [selectedAssistGame, setSelectedAssistGame] = useState<string | null>(null);
    const [selectedAssistPlayer, setSelectedAssistPlayer] = useState<string | null>(null);
    const [assistError, setAssistError] = useState<string | null>(null);
    const gameGoalMutation = useGameGoalMutation({ games, setGames });
    const gameAssistMutation = useGameAssistMutation({ games, setGames });
    const gameDateMutation = useGameDateMutation({ games, setGames });
    const gameTypeMutation = useGameTypeMutation({ games, setGames });
    const gameLocationMutation = useGameLocationMutation({ games, setGames });

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [gamesRes, playersRes, typesRes, teamsRes] = await Promise.all([
                    fetch("/api/games"),
                    fetch("/api/players"),
                    fetch("/api/game-types"),
                    fetch("/api/teams"),
                ]);

                const gamesData = await gamesRes.json();
                const playersData = await playersRes.json();
                const typesData = await typesRes.json();
                const teamsData = await teamsRes.json();



                setGames(gamesData.data || []);
                setPlayers(playersData.data || []);
                setGameTypes(typesData.data || []);
                setOppositionTeams(teamsData.data || []);
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
                    oppositionTeamId: "",
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

    const handleAddTeam = async () => {
        const teamName = newTeamName.trim();
        if (!teamName) return;
        if (!window.confirm(`Add "${teamName}" as a new opposition team?`)) return;

        try {
            const res = await fetch("/api/teams", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ teamName }),
            });
            const result = await res.json();

            if (!result.success) {
                setError(result.error);
                return;
            }

            setOppositionTeams((teams) =>
                teams.some((team) => team.id === result.data.id)
                    ? teams
                    : [...teams, result.data].sort((a, b) =>
                        a.team_name.localeCompare(b.team_name),
                    ),
            );
            setNewGame((game) => ({
                ...game,
                oppositionTeamId: result.data.id,
                oppositionName: result.data.team_name,
            }));
            setNewTeamName("");
            setAddingTeam(false);
            setError(null);
        } catch (err) {
            setError(String(err));
        }
    };

    const handleRecordGoal = async (
        gameId: string,
        goalCount: number,
        playerId?: string,
    ) => {
        const scorerId = playerId || selectedPlayer;
        if (!scorerId) {
            console.warn("[GamesView] No player selected");
            setError2("Please select a player");
            return;
        }

        try {
            const isOppositionGoal = scorerId === OPPOSITION_GOAL;
            const player = isOppositionGoal
                ? undefined
                : players.find((p) => p.id === scorerId);

            if (!isOppositionGoal && !player) {
                console.warn("[GamesView] Player not found");
                setError2("Player not found");
                return;
            }

            const goal = await gameGoalMutation.mutateAsync({
                gameId,
                goalCount,
                player,
                isOppositionGoal,
            });

            setGames((currentGames) =>
                currentGames.map((game) => {
                    if (game.id !== gameId) return game;

                    if (goal.type === "opposition") {
                        return { ...game, score_against: goal.score_against };
                    }

                    const scorers = game.scorers || [];
                    const updatedScorers = goal.goal_count === 0
                        ? scorers.filter((item) => item.player_id !== goal.player_id)
                        : scorers.some((item) => item.player_id === goal.player_id)
                            ? scorers.map((item) =>
                                item.player_id === goal.player_id
                                    ? { ...item, id: goal.id, goal_count: goal.goal_count }
                                    : item,
                            )
                            : [
                                ...scorers,
                                {
                                    id: goal.id,
                                    player_id: goal.player_id,
                                    player_name: goal.player_name,
                                    goal_count: goal.goal_count,
                                    anonymised_id: player?.anonymised_id,
                                },
                            ];

                    return {
                        ...game,
                        score_for: goal.game_score_for,
                        scorers: updatedScorers,
                    };
                }),
            );
            setSelectedPlayer(null);
            setError2(null);
        } catch (err) {
            console.error("[GamesView] Record goal error:", err);
            setError2(String(err));
        }
    };

    const handleRecordAssist = async (
        gameId: string,
        assistCount: number,
        playerId?: string,
    ) => {
        const assistPlayerId = playerId || selectedAssistPlayer;
        if (!assistPlayerId) {
            console.warn("[GamesView] No assist player selected");
            setAssistError("Please select a player");
            return;
        }

        try {
            const player = players.find((p) => p.id === assistPlayerId);
            if (!player) {
                console.warn("[GamesView] Assist player not found");
                setAssistError("Player not found");
                return;
            }

            const assist = await gameAssistMutation.mutateAsync({
                gameId,
                assistCount,
                player,
            });

            setGames((currentGames) =>
                currentGames.map((game) => {
                    if (game.id !== gameId) return game;

                    const assists = game.assists || [];
                    const updatedAssists = assist.assist_count === 0
                        ? assists.filter((item) => item.player_id !== assist.player_id)
                        : assists.some((item) => item.player_id === assist.player_id)
                            ? assists.map((item) =>
                                item.player_id === assist.player_id
                                    ? {
                                        ...item,
                                        id: assist.id,
                                        assist_count: assist.assist_count,
                                    }
                                    : item,
                            )
                            : [
                                ...assists,
                                {
                                    id: assist.id,
                                    player_id: assist.player_id,
                                    player_name: assist.player_name,
                                    assist_count: assist.assist_count,
                                    anonymised_id: player.anonymised_id,
                                },
                            ];

                    return { ...game, assists: updatedAssists };
                }),
            );
            setSelectedAssistPlayer(null);
            setAssistError(null);
        } catch (err) {
            console.error("[GamesView] Record assist error:", err);
            setAssistError(String(err));
        }
    };

    const handleDeleteAssist = async (gameId: string, assistId: string) => {
        if (!window.confirm("Are you sure you want to remove this assist?")) {
            return;
        }

        try {
            const res = await fetch(`/api/games/${gameId}/assists`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ assistId }),
            });

            const result = await res.json();

            if (result.success) {
                console.log("[GamesView] Assist deleted:", result.data);
                // Refresh the games list
                const gamesRes = await fetch("/api/games");
                const gamesData = await gamesRes.json();
                setGames(gamesData.data || []);
            } else {
                console.error("[GamesView] Failed to delete assist:", result.error);
                setAssistError(result.error);
            }
        } catch (err) {
            console.error("[GamesView] Delete assist error:", err);
            setAssistError(String(err));
        }
    };

    const handleDeleteScorer = async (gameId: string, scorerId: string) => {
        if (!window.confirm("Are you sure you want to delete this scorer?")) {
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
        };
    }

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
        <div className="max-w-6xl mx-auto p-1">
            <h2 className="text-xl font-bold mb-1">Lions Games</h2>
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
                        <div className="space-y-2">
                            <select
                                value={addingTeam ? "__add_new__" : newGame.oppositionTeamId}
                                onChange={(e) => {
                                    if (e.target.value === "__add_new__") {
                                        setAddingTeam(true);
                                        setNewGame({ ...newGame, oppositionTeamId: "", oppositionName: "" });
                                        return;
                                    }
                                    const team = oppositionTeams.find((item) => item.id === e.target.value);
                                    setNewGame({
                                        ...newGame,
                                        oppositionTeamId: e.target.value,
                                        oppositionName: team?.team_name || "",
                                    });
                                }}
                                required
                                className="border p-3 rounded bg-gray-50 w-full"
                            >
                                <option value="">Select Opposition Team (required)</option>
                                {oppositionTeams.map((team) => (
                                    <option key={team.id} value={team.id}>
                                        {team.team_name}
                                    </option>
                                ))}
                                <option value="__add_new__">+ Add new team</option>
                            </select>
                            {addingTeam && (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="New team name"
                                        value={newTeamName}
                                        onChange={(e) => setNewTeamName(e.target.value)}
                                        className="border p-3 rounded bg-gray-50 flex-1"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddTeam}
                                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold"
                                    >
                                        Add
                                    </button>
                                </div>
                            )}
                        </div>
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
                                        <h3 className="text-md font-bold">
                                            Lions vs {game.opposition_name}
                                        </h3>
                                    </div>
                                    <button
                                        onClick={() => handleUpdateGameStatus(game.id, "completed")}
                                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-xs font-semibold"
                                    >
                                        Complete
                                    </button>
                                </div>
                                <div className="flex justify-between items-start mb-4">
                                    {/* Game Metadata */}
                                    <div className="game-meta-row text-sm text-gray-600 flex items-center gap-2 mt-1">
                                        <GameDatePicker
                                            date={game.match_date}
                                            id={`game-date-${game.id}`}
                                            name={`game-date-${game.id}`}
                                            isPending={gameDateMutation.isPending}
                                            onChange={(matchDate) => {
                                                gameDateMutation.mutate({
                                                    gameId: game.id,
                                                    matchDate,
                                                });
                                            }}
                                        />
                                        <GameTypeSelect
                                            gameTypeId={game.game_type_id}
                                            gameTypes={gameTypes}
                                            id={`game-type-${game.id}`}
                                            isPending={gameTypeMutation.isPending}
                                            name={`game-type-${game.id}`}
                                            oppositionName={game.opposition_name}
                                            onChange={(gameType) => {
                                                gameTypeMutation.mutate({
                                                    gameId: game.id,
                                                    gameType,
                                                });
                                            }}
                                        />
                                        <LocationSelect
                                            id={`game-location-${game.id}`}
                                            isPending={gameLocationMutation.isPending}
                                            location={game.location}
                                            name={`game-location-${game.id}`}
                                            oppositionName={game.opposition_name}
                                            onChange={(location) => {
                                                gameLocationMutation.mutate({
                                                    gameId: game.id,
                                                    location,
                                                });
                                            }}
                                        />
                                    </div>
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

                                <ScorersPanel
                                    game={game}
                                    activePlayers={activePlayers}
                                    selectedGame={selectedGame}
                                    selectedPlayer={selectedPlayer}
                                    scoringError={scoringError}
                                    onSelectPlayer={(gameId, playerId) => {
                                        setSelectedGame(gameId);
                                        setSelectedPlayer(playerId);
                                    }}
                                    onRecordGoal={handleRecordGoal}
                                    onDeleteScorer={handleDeleteScorer}
                                />

                                <AssistsPanel
                                    game={game}
                                    activePlayers={activePlayers.filter((player) => player.id !== OPPOSITION_GOAL)}
                                    selectedGame={selectedAssistGame}
                                    selectedPlayer={selectedAssistPlayer}
                                    assistError={assistError}
                                    onSelectPlayer={(gameId, playerId) => {
                                        setSelectedAssistGame(gameId);
                                        setSelectedAssistPlayer(playerId);
                                    }}
                                    onRecordAssist={handleRecordAssist}
                                    onDeleteAssist={handleDeleteAssist}
                                />

                                {/* Delete Game Button */}
                                <div className="mt-4 flex justify-end" >
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
                </div >
            )
            }

            {/* Completed Games */}
            {
                completedGames.length > 0 && (
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
                )
            }

            {
                games.length === 0 && (
                    <div className="bg-gray-100 p-6 rounded-lg text-center text-gray-600">
                        <p className="text-lg">No games yet. Create one above to get started!</p>
                    </div>
                )
            }
        </div >
    );
}
