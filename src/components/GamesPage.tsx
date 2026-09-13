"use client";

import { useState } from "react";
import DashboardShell from "@/components/DashboardShell";
import GamesView from "@/components/GamesView";
import type { AuthRole } from "@/lib/auth";

export default function GamesPage({ role }: { role: AuthRole }) {
    const [hasInProgressGame, setHasInProgressGame] = useState(false);

    return (
        <DashboardShell activeTab="games" role={role} hasInProgressGame={hasInProgressGame}>
            <GamesView onInProgressGameChange={setHasInProgressGame} />
        </DashboardShell>
    );
}