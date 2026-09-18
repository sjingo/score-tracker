import { useEffect, useState } from "react";

export type LeaderboardEntry = {
    playerId: string;
    playerName: string;
    value: number;
};

export type LeaderboardStat = {
    key: string;
    title: string;
    summaryLabel: string;
    entries: LeaderboardEntry[];
    totalValue: number;
    playerCount: number;
};

interface LeaderboardStatsProps {
    leaderboards: LeaderboardStat[];
}

function LeaderboardCard({
    leaderboard,
    onOpen,
}: {
    leaderboard: LeaderboardStat;
    onOpen: () => void;
}) {
    const topEntries = leaderboard.entries.slice(0, 5);

    return (
        <section className="rounded-lg bg-salts-blue p-4 text-white shadow sm:p-5">
            <button
                type="button"
                onClick={onOpen}
                aria-haspopup="dialog"
                className="flex w-full items-center justify-between gap-2 text-left sm:gap-3"
            >
                <span>
                    <span className="block text-lg font-semibold text-white sm:text-xl">{leaderboard.title}</span>
                    <span className="mt-1 block text-sm text-white">{leaderboard.playerCount} players · {leaderboard.totalValue} total</span>
                </span>
                <span className="cursor-pointer text-sm font-semibold text-amber-200 underline decoration-amber-200/70 underline-offset-2 transition-colors hover:text-white hover:decoration-white">View all</span>
            </button>
            <div className="mt-3 border-t border-blue-400 pt-3 sm:mt-4 sm:pt-4">
                {topEntries.length === 0 ? (
                    <p className="text-sm italic text-white">No players with recorded stats.</p>
                ) : (
                    <LeaderboardList entries={topEntries} />
                )}
            </div>
        </section>
    );
}

function LeaderboardList({ entries }: { entries: LeaderboardEntry[] }) {
    return (
        <ol className="space-y-2 sm:space-y-3">
            {entries.map((entry, index) => (
                <li key={entry.playerId} className="flex items-center justify-between gap-2 border-b border-blue-400 pb-1.5 last:border-0 last:pb-0 sm:gap-3 sm:pb-2">
                    <span className="flex min-w-0 items-center gap-2 sm:gap-3">
                        <span className="w-5 text-sm font-semibold text-white">{index + 1}</span>
                        <span className="truncate text-amber-200">{entry.playerName}</span>
                    </span>
                    <span className="shrink-0 font-bold text-amber-200">{entry.value}</span>
                </li>
            ))}
        </ol>
    );
}

export default function LeaderboardStats({
    leaderboards,
}: LeaderboardStatsProps) {
    const [selectedLeaderboard, setSelectedLeaderboard] = useState<LeaderboardStat | null>(null);

    useEffect(() => {
        if (!selectedLeaderboard) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setSelectedLeaderboard(null);
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedLeaderboard]);

    return (
        <>
            <section className="mb-4 rounded-lg bg-salts-blue p-4 text-white shadow sm:mb-6 sm:p-6">
                <div className="mb-4 sm:mb-5">
                    <h2 className="text-xl font-bold text-white sm:text-2xl">Player stats</h2>
                    <p className="mt-1 text-white">Player contributions </p>
                </div>
                <div className="grid grid-cols-[repeat(3,minmax(0,1fr))] gap-2">
                    {leaderboards.map((leaderboard) => (
                        <div key={leaderboard.key} className="min-w-0 border-l-2 border-amber-200 pl-2 sm:pl-3">
                            <p className="text-sm font-semibold uppercase tracking-wide text-white">{leaderboard.summaryLabel}</p>
                            <p className="mt-1 text-2xl font-bold text-amber-200 sm:text-3xl">{leaderboard.totalValue}</p>
                            <p className="text-sm text-white">across {leaderboard.playerCount} players</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mb-4 grid gap-3 sm:mb-6 sm:gap-4 lg:grid-cols-3">
                {leaderboards.map((leaderboard) => (
                    <LeaderboardCard
                        key={leaderboard.key}
                        leaderboard={leaderboard}
                        onOpen={() => setSelectedLeaderboard(leaderboard)}
                    />
                ))}
            </section>

            {selectedLeaderboard && (
                <div
                    className="leaderboard-drawer-overlay fixed inset-0 z-50 bg-black/40"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setSelectedLeaderboard(null);
                    }}
                >
                    <aside
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="leaderboard-drawer-title"
                        className="leaderboard-drawer ml-auto flex h-full w-full max-w-md flex-col bg-salts-blue p-4 text-white shadow-xl sm:p-6"
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-blue-400 pb-4">
                            <div>
                                <h2 id="leaderboard-drawer-title" className="text-xl font-bold text-white sm:text-2xl">
                                    {selectedLeaderboard.title}
                                </h2>
                                <p className="mt-1 text-sm text-white">
                                    {selectedLeaderboard.playerCount} players · {selectedLeaderboard.totalValue} total
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedLeaderboard(null)}
                                className="text-sm font-semibold text-amber-200 hover:text-white"
                                aria-label="Close leaderboard"
                            >
                                Close
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto py-4">
                            {selectedLeaderboard.entries.length === 0 ? (
                                <p className="text-sm italic text-white">No players with recorded stats.</p>
                            ) : (
                                <LeaderboardList entries={selectedLeaderboard.entries} />
                            )}
                        </div>
                    </aside>
                </div>
            )}
        </>
    );
}