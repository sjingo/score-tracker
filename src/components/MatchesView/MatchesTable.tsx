import { Game, GameType } from '../types';
import Alert from '@/components/Alert';
import TableShell from './TableShell';

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
            <Alert tone="info" className="rounded-lg border-0 p-4 text-center sm:p-6">
                No matches found
            </Alert>
        );
    }

    return (
        <TableShell gameType={gameType}>
            <table className="w-full min-w-[640px]">
                <thead className="bg-gray-100 border-b border-salts-blue">
                    <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-700 sm:px-6 sm:py-3">Date</th>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-700 sm:px-6 sm:py-3">Opposition</th>
                        <th className="px-3 py-2 text-center text-xs font-medium uppercase text-gray-700 sm:px-6 sm:py-3">Score</th>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-700 sm:px-6 sm:py-3">Venue</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                    {sorted.map((match) => (
                        <tr key={match.id} className="hover:bg-gray-50">
                            <td className="px-3 py-3 text-sm text-gray-900 sm:px-6 sm:py-4">
                                {new Date(match.match_date).toLocaleDateString('en-US', {
                                    weekday: 'short',
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                })}
                            </td>
                            <td className="px-3 py-3 text-sm font-medium text-gray-900 sm:px-6 sm:py-4">
                                {match.opposition_name}
                            </td>
                            <td className="px-3 py-3 text-center text-sm font-semibold sm:px-6 sm:py-4">
                                <span className="inline-flex items-center justify-center min-w-12 px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                    {match.score_for} - {match.score_against}
                                </span>
                            </td>
                            <td className="px-3 py-3 text-sm text-gray-600 sm:px-6 sm:py-4">
                                {match.location || 'N/A'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </TableShell>
    );
}
