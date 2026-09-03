"use client";

import { useState } from "react";
import { usePlayersQuery } from "@/app/api/players/hooks/usePlayersQuery";
import { useCreatePlayerMutation } from "@/app/api/players/hooks/useCreatePlayerMutation";

export default function PlayersView() {
    const [newPlayer, setNewPlayer] = useState({
        name: "",
        jerseyNumber: "",
    });

    const {
        data: players = [],
        isLoading,
        isError,
        error,
    } = usePlayersQuery();

    const addPlayerMutation = useCreatePlayerMutation();

    const handleAddPlayer = async (e: React.FormEvent) => {
        e.preventDefault();
        await addPlayerMutation.mutateAsync(newPlayer, {
            onSuccess: () => {
                setNewPlayer({ name: "", jerseyNumber: "" });
            },
        });
    };

    if (isLoading) return <div className="p-4">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6 sr-only">Lions Squad</h1>
            {isError && (
                <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-red-700">
                    {error instanceof Error ? error.message : "Failed to load players"}
                </div>
            )}

            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                <h2 className="text-xl font-semibold mb-4">Add Player</h2>
                <form onSubmit={handleAddPlayer} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <input
                            type="text"
                            placeholder="Player name"
                            value={newPlayer.name}
                            onChange={(e) =>
                                setNewPlayer({ ...newPlayer, name: e.target.value })
                            }
                            required
                            className="border p-2 rounded"
                        />
                        <input
                            type="number"
                            placeholder="Jersey Number"
                            value={newPlayer.jerseyNumber}
                            onChange={(e) =>
                                setNewPlayer({ ...newPlayer, jerseyNumber: e.target.value })
                            }
                            className="border p-2 rounded"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={addPlayerMutation.isPending}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-60"
                    >
                        {addPlayerMutation.isPending ? "Adding..." : "Add Player"}
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {players.length === 0 ? (
                    <p className="col-span-full text-gray-500 text-center py-6">
                        No players yet. Add one above!
                    </p>
                ) : (
                    players.map((player) => (
                        <div
                            key={player.id}
                            className="bg-white p-2 rounded-lg shadow-md border-l-4 border-green-500"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex justify-between w-100">
                                        <h3 className="font-semibold text-lg">
                                            {player.name}
                                        </h3>
                                    </div>
                                    {player.jersey_number && (
                                        <p className="text-2xl font-bold text-blue-600">
                                            #{player.jersey_number}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <span className="text-xs text-gray-500 mt-2">{player.anonymised_id}</span>
                        </div>
                    ))
                )}
            </div>
        </div >
    );
}
