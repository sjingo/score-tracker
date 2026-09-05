"use client";

import { useXgStatsQuery } from "@/app/api/stats/useXgStatsQuery";

function formatDate(value: string) {
    return new Date(`${value.slice(0, 10)}T00:00:00Z`).toLocaleDateString();
}

export default function StatsView() {
    const { data: games = [], isLoading, isError } = useXgStatsQuery();

    if (isLoading) {
        return <div className="max-w-6xl mx-auto px-4 py-8 text-gray-500">Loading stats...</div>;
    }

    if (isError) {
        return <div className="max-w-6xl mx-auto px-4 py-8 text-red-700">Failed to load xG stats.</div>;
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Expected goals</h1>
                <p className="mt-2 text-gray-600">Chance quality compared with actual goals scored.</p>
            </div>

            {games.length === 0 ? (
                <div className="rounded-lg bg-white p-6 text-center text-gray-500 shadow">No games found.</div>
            ) : (
                <div className="space-y-6">
                    {games.map((game) => (
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
                                    <div key={item.type} className="rounded border border-gray-200 p-4">
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