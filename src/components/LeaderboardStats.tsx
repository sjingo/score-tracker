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
        <section className="rounded-lg bg-salts-blue p-4 text-white shadow sm:p-5">
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={isExpanded}
                className="flex w-full items-center justify-between gap-2 text-left sm:gap-3"
            >
                <span>
                    <span className="block text-lg font-semibold text-amber-200 sm:text-xl">{leaderboard.title}</span>
                    <span className="mt-1 block text-sm text-blue-100">{leaderboard.playerCount} players · {leaderboard.totalValue} total</span>
                </span>
                <span className="text-lg text-amber-200 sm:text-xl" aria-hidden="true">{isExpanded ? "−" : "+"}</span>
            </button>
            {isExpanded && (
                <div className="mt-3 border-t border-blue-400 pt-3 sm:mt-4 sm:pt-4">
                    {leaderboard.entries.length === 0 ? (
                        <p className="text-sm italic text-blue-100">No players with recorded stats.</p>
                    ) : (
                        <ol className="space-y-2 sm:space-y-3">
                            {leaderboard.entries.map((entry, index) => (
                                <li key={entry.playerId} className="flex items-center justify-between gap-2 border-b border-blue-400 pb-1.5 last:border-0 last:pb-0 sm:gap-3 sm:pb-2">
                                    <span className="flex min-w-0 items-center gap-2 sm:gap-3">
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
            <section className="mb-4 rounded-lg bg-salts-blue p-4 text-white shadow sm:mb-6 sm:p-6">
                <div className="mb-4 sm:mb-5">
                    <h2 className="text-xl font-bold text-white sm:text-2xl">Player stats</h2>
                    <p className="mt-1 text-blue-100">Recorded player contributions across all games.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
                    {leaderboards.map((leaderboard) => (
                        <div key={leaderboard.key} className="border-l-4 border-amber-200 pl-3 sm:pl-4">
                            <p className="text-sm font-semibold uppercase tracking-wide text-amber-200">{leaderboard.summaryLabel}</p>
                            <p className="mt-1 text-2xl font-bold text-white sm:text-3xl">{leaderboard.totalValue}</p>
                            <p className="text-sm text-blue-100">across {leaderboard.playerCount} players</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mb-4 grid gap-3 sm:mb-6 sm:gap-4 lg:grid-cols-3">
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