"use client";

import { useState } from "react";
// import Link from "next/link";
import GamesView from "@/components/GamesView";
import PlayersView from "@/components/PlayersView";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"games" | "players">("games");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-blue-600">Lions Score Tracker</h1>
            <p className="text-gray-600">Under-9 Football Team - Phase 2 API</p>
          </div>
          {/* <Link
            href="/debug"
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 text-sm font-semibold"
          >
            🔍 Debug Console
          </Link> */}
        </div>
      </header>

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
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border-b-2 border-blue-200">
        <div className="max-w-6xl mx-auto px-4 py-3 text-sm text-blue-800">
          <p>
            <strong>Phase 2 Features:</strong> Full Games CRUD, Score Tracking with Auto-Increment,
            Player Validation, Comprehensive Logging (check browser console F12), Debug Tables
            Viewer
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="py-6">
        {activeTab === "games" && <GamesView />}
        {activeTab === "players" && <PlayersView />}
      </main>

      {/* Footer Info */}
      <footer className="bg-gray-800 text-gray-300 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm">
          {/* <p>🔧 Console Logging Enabled | Open Developer Tools (F12) to see detailed API logs</p>
          <p className="mt-2">
            <Link href="/debug" className="text-blue-400 hover:text-blue-300">
              View Debug Console
            </Link>
            {" "} for full database table viewer
          </p> */}
        </div>
      </footer>
    </div>
  );
}
