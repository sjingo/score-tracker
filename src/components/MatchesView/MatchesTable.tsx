import { Game, GameType } from '../types';

interface MatchesTableProps {
    matches: Game[];
    gameType?: GameType;
    sortBy: 'date-asc' | 'date-desc' | 'score';
}

export default function MatchesTable({ matches, gameType, sortBy }: MatchesTableProps) {
    const filtered = matches.filter((match) => match.status === 'completed');

    const sorted = [...filtered].sort((a, b) => {
        switch (sortBy) {
            case 'date-desc':
                return new Date(b.match_date).getTime() - new Date(a.match_date).getTime();
            case 'date-asc':
                return new Date(a.match_date).getTime() - new Date(b.match_date).getTime();
            case 'score':
                return (b.score_for - b.score_against) - (a.score_for - a.score_against);
            default:
                return 0;
        }
    });

    if (sorted.length === 0) {
        return (
            <div className="p-6 bg-gray-50 rounded-lg text-center text-gray-500">
                No matches found
            </div>
        );
    }

    return (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
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
            <table className="w-full">
                <thead className="bg-gray-100 border-b border-gray-200">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Opposition</th>
                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Score</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Venue</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {sorted.map((match) => (
                        <tr key={match.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">
                                {new Date(match.match_date).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                })}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                {match.opposition_name}
                            </td>
                            <td className="px-6 py-4 text-sm text-center font-semibold">
                                <span className="inline-flex items-center justify-center min-w-12 px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                    {match.score_for} - {match.score_against}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                                {match.location || 'N/A'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
