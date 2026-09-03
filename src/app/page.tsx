"use client";

import { useState } from "react";
import GamesView from "@/components/GamesView";
import PlayersView from "@/components/PlayersView";
import MatchesView from "@/components/MatchesView";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"games" | "players" | "matches">("games");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("games")}
              className={`px-4 py-3 font-semibold border-b-2 transition ${activeTab === "games"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
            >
              ⚽ Games
            </button>
            <button
              onClick={() => setActiveTab("players")}
              className={`px-4 py-3 font-semibold border-b-2 transition ${activeTab === "players"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
            >
              👥 Squad
            </button>
            <button
              onClick={() => setActiveTab("matches")}
              className={`px-4 py-3 font-semibold border-b-2 transition ${activeTab === "matches"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
            >
              📊 Matches
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="py-6">
        {activeTab === "games" && <GamesView />}
        {activeTab === "players" && <PlayersView />}
        {activeTab === "matches" && <MatchesView />}
      </div>

      {/* Footer Info */}
      <footer className="bg-gray-800 text-gray-300 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm">

        </div>
      </footer>
    </div>
  );
}
