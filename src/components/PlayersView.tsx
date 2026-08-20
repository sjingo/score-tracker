"use client";

import { useEffect, useState } from "react";

interface Player {
    id: string;
    name: string;
    jersey_number: number | null;
    anonymised_id: string;
}

export default function PlayersView() {
    const [players, setPlayers] = useState<Player[]>([]);
    const [loading, setLoading] = useState(true);
    const [newPlayer, setNewPlayer] = useState({
        name: "",
        jerseyNumber: "",
    });

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch("/api/players");
                const data = await res.json();
                setPlayers(data.data || []);
            } catch (error) {
                console.error("Error fetching players:", error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleAddPlayer = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const res = await fetch("/api/players", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: newPlayer.name,
                    jerseyNumber: newPlayer.jerseyNumber
                        ? parseInt(newPlayer.jerseyNumber)
                        : null,
                }),
            });

            if (res.ok) {
                const result = await res.json();
                setPlayers([...players, result.data]);
                setNewPlayer({
                    name: "",
                    jerseyNumber: "",
                });
            }
        } catch (error) {
            console.error("Error adding player:", error);
        }
    };

    if (loading) return <div className="p-4">Loading...</div>;

    return (
        <div className="max-w-4xl mx-auto p-4">
            <h1 className="text-3xl font-bold mb-6">🦁 Lions Squad</h1>

            {/* Add Player Form */}
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
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                    >
                        Add Player
                    </button>
                </form>
            </div>

            {/* Players List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {players.length === 0 ? (
                    <p className="col-span-full text-gray-500 text-center py-8">
                        No players yet. Add one above!
                    </p>
                ) : (
                    players.map((player) => (
                        <div
                            key={player.id}
                            className="bg-white p-4 rounded-lg shadow-md border-l-4 border-green-500"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h3 className="font-semibold text-lg">
                                        {player.name}
                                    </h3>
                                    {player.jersey_number && (
                                        <p className="text-2xl font-bold text-blue-600">
                                            #{player.jersey_number}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">{player.anonymised_id}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
