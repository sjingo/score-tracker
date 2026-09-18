"use client";

import { useState } from "react";
import { usePlayersQuery } from "@/app/api/players/hooks/usePlayersQuery";
import { useCreatePlayerMutation } from "@/app/api/players/hooks/useCreatePlayerMutation";
import LoadingSpinner from "@/components/LoadingSpinner";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import SectionHeading from "@/components/SectionHeading";
import Alert from "@/components/Alert";
import Surface from "@/components/Surface";

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

    if (isLoading) return <LoadingSpinner label="Loading players..." className="mx-auto max-w-4xl" />;

    return (
        <PageContainer size="content">
            <PageHeader title="Lions Squad" />
            {isError && (
                <Alert className="mb-4">
                    {error instanceof Error ? error.message : "Failed to load players"}
                </Alert>
            )}

            <Surface className="mb-4 p-4 sm:mb-6 sm:p-6">
                <SectionHeading title="Add Player" />
                <form onSubmit={handleAddPlayer} className="space-y-4">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                        <input
                            type="text"
                            placeholder="Player name"
                            value={newPlayer.name}
                            onChange={(e) =>
                                setNewPlayer({ ...newPlayer, name: e.target.value })
                            }
                            required
                            className="rounded border px-3 py-1.5 sm:p-2"
                        />
                        <input
                            type="number"
                            placeholder="Jersey Number"
                            value={newPlayer.jerseyNumber}
                            onChange={(e) =>
                                setNewPlayer({ ...newPlayer, jerseyNumber: e.target.value })
                            }
                            className="rounded border px-3 py-1.5 sm:p-2"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={addPlayerMutation.isPending}
                        className="rounded bg-salts-blue px-3 py-1.5 text-white hover:bg-salts-blue disabled:opacity-60 sm:px-4 sm:py-2"
                    >
                        {addPlayerMutation.isPending ? "Adding..." : "Add Player"}
                    </button>
                </form>
            </Surface>

            <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
                {players.length === 0 ? (
                    <p className="col-span-full py-4 text-center text-gray-500 sm:py-6">
                        No players yet. Add one above!
                    </p>
                ) : (
                    players.map((player) => (
                        <div
                            key={player.id}
                            className="min-w-0 rounded-lg border-l-4 border-salts-blue bg-white p-3 shadow-md sm:p-4"
                        >
                            <div className="flex min-w-0 items-start justify-between">
                                <div className="min-w-0 w-full">
                                    <div className="flex min-w-0 w-full justify-between">
                                        <h3 className="break-words text-base font-semibold sm:text-lg">
                                            {player.name}
                                        </h3>
                                    </div>
                                    {player.jersey_number && (
                                        <p className="text-xl font-bold text-blue-600 sm:text-2xl">
                                            #{player.jersey_number}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <span className="mt-2 break-all text-xs text-gray-500">{player.anonymised_id}</span>
                        </div>
                    ))
                )}
            </div>
        </PageContainer>
    );
}
