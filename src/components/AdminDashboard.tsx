"use client";

import { useState } from "react";
import GamesView from "@/components/GamesView";
import PlayersView from "@/components/PlayersView";
import MatchesView from "@/components/MatchesView";
import StatsView from "@/components/StatsView";

export default function AdminDashboard() {
    const [activeTab, setActiveTab] = useState<"games" | "players" | "matches" | "stats">("games");

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="bg-white border-b">
                <div className="max-w-6xl mx-auto px-4">
                    <div className="flex min-w-0 gap-4 overflow-x-auto">
                        {([
                            ["games", "⚽ Games"],
                            ["matches", "📊 Matches"],
                            ["stats", "📈 Stats"],
                            ["players", "👥 Squad"],
                        ] as const).map(([tab, label]) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`shrink-0 px-4 py-3 font-semibold border-b-2 transition ${activeTab === tab
                                    ? "border-salts-blue text-blue-600"
                                    : "border-transparent text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="py-6">
                {activeTab === "games" && <GamesView />}
                {activeTab === "matches" && <MatchesView />}
                {activeTab === "stats" && <StatsView />}
                {activeTab === "players" && <PlayersView />}
            </div>

            <footer className="bg-gray-800 text-gray-300 py-6 mt-12" />
        </div>
    );
}