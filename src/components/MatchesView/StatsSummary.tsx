import { ReactNode } from 'react';

interface StatsSummaryProps {
    completedGames: number;
    goalsFor: number;
    goalsAgainst: number;
    children: ReactNode;
}

export default function StatsSummary({
    completedGames,
    goalsFor,
    goalsAgainst,
    children,
}: StatsSummaryProps) {
    return (
        <div className="mb-2 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-4">
            <div className="flex items-center justify-center gap-1.5 rounded-lg bg-salts-blue p-2 shadow md:gap-2 md:p-3">
                <span className="text-xl font-bold text-amber-200 md:text-2xl">
                    {completedGames}
                </span>
                <span className="whitespace-nowrap text-sm text-blue-100">Matches</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 rounded-lg bg-salts-blue p-2 shadow md:gap-2 md:p-3">
                <span className="text-xl font-bold text-amber-200 md:text-2xl">
                    {goalsFor}
                </span>
                <span className="whitespace-nowrap text-sm text-blue-100">Scored</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 rounded-lg bg-salts-blue p-2 shadow md:gap-2 md:p-3">
                <span className="text-xl font-bold text-amber-200 md:text-2xl">
                    {goalsAgainst}
                </span>
                <span className="whitespace-nowrap text-sm text-blue-100">Conceded</span>
            </div>
            <div className="flex items-center justify-center gap-1.5 rounded-lg bg-white p-2 shadow md:gap-2 md:p-3">
                {children}
            </div>
        </div>
    );
}