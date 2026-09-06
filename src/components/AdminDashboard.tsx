"use client";

import { useState, useCallback, useEffect } from "react";
import GamesView from "@/components/GamesView";
import PlayersView from "@/components/PlayersView";
import MatchesView from "@/components/MatchesView";
import StatsView from "@/components/StatsView";
import { Game } from "@/components/types";

export default function AdminDashboard({ initialGames }: { initialGames: Game[] }) {
    const [activeTab, setActiveTab] = useState<"games" | "players" | "matches" | "stats">("games");
    const [hasInProgressGame, setHasInProgressGame] = useState(false);
    const [pendingTab, setPendingTab] = useState<"games" | "players" | "matches" | "stats" | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);

    const handleTabChange = useCallback((tab: "games" | "players" | "matches" | "stats") => {
        // If on Games tab with in-progress game, show confirmation
        if (activeTab === "games" && hasInProgressGame && tab !== "games") {
            setPendingTab(tab);
            setShowConfirm(true);
            return;
        }
        setActiveTab(tab);
    }, [activeTab, hasInProgressGame]);

    const handleConfirmNavigation = () => {
        if (pendingTab) {
            setActiveTab(pendingTab);
        }
        setShowConfirm(false);
        setPendingTab(null);
    };

    const handleCancelNavigation = () => {
        setShowConfirm(false);
        setPendingTab(null);
    };

    // Add beforeunload listener when on Games tab with in-progress game
    useEffect(() => {
        if (activeTab === "games" && hasInProgressGame) {
            const handleBeforeUnload = (e: BeforeUnloadEvent) => {
                e.preventDefault();
                e.returnValue = "You have a game in progress. Are you sure you want to leave?";
                return "You have a game in progress. Are you sure you want to leave?";
            };
            window.addEventListener("beforeunload", handleBeforeUnload);
            return () => window.removeEventListener("beforeunload", handleBeforeUnload);
        }
    }, [activeTab, hasInProgressGame]);

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
                                onClick={() => handleTabChange(tab)}
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
                {activeTab === "games" && (
                    <GamesView
                        initialGames={initialGames}
                        onInProgressGameChange={setHasInProgressGame}
                    />
                )}
                {activeTab === "matches" && <MatchesView isActive={activeTab === "matches"} />}
                {activeTab === "stats" && <StatsView />}
                {activeTab === "players" && <PlayersView />}
            </div>

            {showConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm mx-4">
                        <h2 className="text-lg font-semibold text-gray-900 mb-3">
                            Game in Progress
                        </h2>
                        <p className="text-gray-600 mb-6">
                            You have a game in progress. Navigating away may lose unsaved data. Are you sure you want to continue?
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={handleCancelNavigation}
                                className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmNavigation}
                                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 font-medium"
                            >
                                Leave Game
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <footer className="bg-gray-800 text-gray-300 py-6 mt-12" />
        </div>
    );
}