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
        <div className="grid grid-cols-2 gap-4 mb-2 md:grid-cols-4">
            <div className="bg-salts-blue rounded-lg shadow p-2 flex items-center gap-2">
                <span className="text-2xl font-bold text-amber-200">
                    {completedGames}
                </span>
                <span className="text-blue-100 text-sm"> Matches </span>
            </div>
            <div className="bg-salts-blue rounded-lg shadow p-2 flex items-center gap-2">
                <span className="text-xl font-bold text-amber-200">
                    {goalsFor}
                </span>
                <span className="text-blue-100 text-sm"> Scored</span>
            </div>
            <div className="bg-salts-blue rounded-lg shadow p-2 flex items-center gap-2">
                <span className="text-2xl font-bold text-amber-200">
                    {goalsAgainst}
                </span>
                <span className="text-blue-100 text-sm"> Conceded</span>
            </div>
            <div className="bg-white rounded-lg shadow p-2 flex justify-center items-center gap-2">
                {children}
            </div>
        </div>
    );
}