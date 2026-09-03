import { Game, GameType } from '../types';

interface LeagueTableProps {
    matches: Game[];
    gameType?: GameType;
    teamName?: string;
}

interface LeagueStats {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    goalDifference: number;
    form: Array<{ result: 'W' | 'D' | 'L'; date: string }>;
}

function calculateStats(matches: Game[]): LeagueStats {
    const completed = matches.filter((m) => m.status === 'completed');

    let won = 0;
    let drawn = 0;
    let lost = 0;
    let goalsFor = 0;
    let goalsAgainst = 0;

    completed.forEach((match) => {
        goalsFor += match.score_for;
        goalsAgainst += match.score_against;

        if (match.score_for > match.score_against) {
            won++;
        } else if (match.score_for === match.score_against) {
            drawn++;
        } else {
            lost++;
        }
    });

    // Get last 5 results for form
    const sorted = [...completed].sort(
        (a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime()
    );

    const form = sorted.slice(0, 5).map((match) => {
        let result: 'W' | 'D' | 'L';
        if (match.score_for > match.score_against) {
            result = 'W';
        } else if (match.score_for === match.score_against) {
            result = 'D';
        } else {
            result = 'L';
        }
        return { result, date: match.match_date };
    });

    return {
        played: completed.length,
        won,
        drawn,
        lost,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
        form,
    };
}

export default function LeagueTable({ matches, gameType, teamName = 'Lions' }: LeagueTableProps) {
    const stats = calculateStats(matches);

    if (stats.played === 0) {
        return (
            <div className="p-6 bg-gray-50 rounded-lg text-center text-gray-500">
                No completed matches found
            </div>
        );
    }

    const getFormColor = (result: 'W' | 'D' | 'L') => {
        switch (result) {
            case 'W':
                return 'bg-green-500';
            case 'D':
                return 'bg-amber-500';
            case 'L':
                return 'bg-red-500';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            {gameType && (
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: gameType.color || '#999' }}
                        />
                        {gameType.display_name}
                    </h3>
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-100 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Team</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">P</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">W</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">D</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">L</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">For</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Against</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">GD</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Form</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="hover:bg-gray-50 border-b border-gray-200">
                            <td className="px-6 py-4 text-sm font-semibold text-gray-900">{teamName}</td>
                            <td className="px-6 py-4 text-sm text-center font-medium text-gray-900">{stats.played}</td>
                            <td className="px-6 py-4 text-sm text-center font-medium text-green-600">{stats.won}</td>
                            <td className="px-6 py-4 text-sm text-center font-medium text-amber-600">{stats.drawn}</td>
                            <td className="px-6 py-4 text-sm text-center font-medium text-red-600">{stats.lost}</td>
                            <td className="px-6 py-4 text-sm text-center font-medium text-blue-600">{stats.goalsFor}</td>
                            <td className="px-6 py-4 text-sm text-center font-medium text-blue-600">{stats.goalsAgainst}</td>
                            <td className="px-6 py-4 text-sm text-center font-semibold text-gray-900">
                                {stats.goalDifference > 0 ? '+' : ''}{stats.goalDifference}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex gap-1">
                                    {stats.form.map((f, i) => (
                                        <div
                                            key={i}
                                            className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold text-white ${getFormColor(
                                                f.result
                                            )}`}
                                            title={new Date(f.date).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        >
                                            {f.result}
                                        </div>
                                    ))}
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
