"use client";

import { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import GamesView from "@/components/GamesView";
import { Game } from "@/components/types";
import type { AuthRole } from "@/lib/auth";

export default function GamesPage({ initialGames, role }: { initialGames: Game[]; role: AuthRole }) {
    const [hasInProgressGame, setHasInProgressGame] = useState(false);

    return (
        <DashboardShell activeTab="games" role={role} hasInProgressGame={hasInProgressGame}>
            <GamesView
                initialGames={initialGames}
                onInProgressGameChange={setHasInProgressGame}
            />
        </DashboardShell>
    );
}