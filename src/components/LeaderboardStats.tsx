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
    expandedLeaderboards: Record<string, boolean>;
    onToggle: (key: string) => void;
}

function LeaderboardCard({
    leaderboard,
    isExpanded,
    onToggle,
}: {
    leaderboard: LeaderboardStat;
    isExpanded: boolean;
    onToggle: () => void;
}) {
    return (
        <section className="rounded-lg bg-salts-blue p-5 text-white shadow">
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={isExpanded}
                className="flex w-full items-center justify-between gap-3 text-left"
            >
                <span>
                    <span className="block text-xl font-semibold text-amber-200">{leaderboard.title}</span>
                    <span className="mt-1 block text-sm text-blue-100">{leaderboard.playerCount} players · {leaderboard.totalValue} total</span>
                </span>
                <span className="text-xl text-amber-200" aria-hidden="true">{isExpanded ? "−" : "+"}</span>
            </button>
            {isExpanded && (
                <div className="mt-4 border-t border-blue-400 pt-4">
                    {leaderboard.entries.length === 0 ? (
                        <p className="text-sm italic text-blue-100">No players with recorded stats.</p>
                    ) : (
                        <ol className="space-y-3">
                            {leaderboard.entries.map((entry, index) => (
                                <li key={entry.playerId} className="flex items-center justify-between gap-3 border-b border-blue-400 pb-2 last:border-0 last:pb-0">
                                    <span className="flex min-w-0 items-center gap-3">
                                        <span className="w-5 text-sm font-semibold text-blue-200">{index + 1}</span>
                                        <span className="truncate text-white">{entry.playerName}</span>
                                    </span>
                                    <span className="shrink-0 font-bold text-amber-200">{entry.value}</span>
                                </li>
                            ))}
                        </ol>
                    )}
                </div>
            )}
        </section>
    );
}

export default function LeaderboardStats({
    leaderboards,
    expandedLeaderboards,
    onToggle,
}: LeaderboardStatsProps) {
    return (
        <>
            <section className="mb-6 rounded-lg bg-salts-blue p-6 text-white shadow">
                <div className="mb-5">
                    <h2 className="text-2xl font-bold text-white">Player stats</h2>
                    <p className="mt-1 text-blue-100">Recorded player contributions across all games.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                    {leaderboards.map((leaderboard) => (
                        <div key={leaderboard.key} className="border-l-4 border-amber-200 pl-4">
                            <p className="text-sm font-semibold uppercase tracking-wide text-amber-200">{leaderboard.summaryLabel}</p>
                            <p className="mt-1 text-3xl font-bold text-white">{leaderboard.totalValue}</p>
                            <p className="text-sm text-blue-100">across {leaderboard.playerCount} players</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mb-6 grid gap-4 lg:grid-cols-3">
                {leaderboards.map((leaderboard) => (
                    <LeaderboardCard
                        key={leaderboard.key}
                        leaderboard={leaderboard}
                        isExpanded={Boolean(expandedLeaderboards[leaderboard.key])}
                        onToggle={() => onToggle(leaderboard.key)}
                    />
                ))}
            </section>
        </>
    );
}