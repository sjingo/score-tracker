import { Game, GameType } from '../types';

interface MatchResultsProps {
    matches: Game[];
    gameType?: GameType;
}

export default function MatchResults({ matches, gameType }: MatchResultsProps) {
    const completed = [...matches]
        .filter((m) => m.status === 'completed')
        .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime());

    if (completed.length === 0) {
        return null;
    }

    const getResultBadge = (scoreFor: number, scoreAgainst: number) => {
        if (scoreFor > scoreAgainst) {
            return { text: 'W', color: 'bg-green-100 text-green-700' };
        } else if (scoreFor === scoreAgainst) {
            return { text: 'D', color: 'bg-amber-100 text-amber-700' };
        } else {
            return { text: 'L', color: 'bg-red-100 text-red-700' };
        }
    };

    const truncateScorers = (scorers: any[], maxLines: number = 2) => {
        if (!scorers || scorers.length === 0) return [];
        // Simple truncation: assume ~2 scorers per line at small font
        const maxItems = maxLines * 2;
        return scorers.slice(0, maxItems);
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
                        {gameType.display_name} - Results
                    </h3>
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-100 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Match</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Score</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase">Result</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Scorers</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">Assists</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {completed.map((match) => {
                            const result = getResultBadge(match.score_for, match.score_against);
                            const scorers = truncateScorers(match.scorers || []);
                            const assists = truncateScorers(match.assists || []);
                            const hasMoreScorers = (match.scorers?.length || 0) > 4;
                            const hasMoreAssists = (match.assists?.length || 0) > 4;

                            return (
                                <tr key={match.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">
                                            Lions vs {match.opposition_name}
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {new Date(match.match_date).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="text-lg font-bold text-gray-900">
                                            {match.score_for} - {match.score_against}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${result.color}`}>
                                            {result.text}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs text-gray-700 leading-relaxed max-h-12 overflow-hidden">
                                            {scorers.length > 0 ? (
                                                <div>
                                                    {scorers.map((scorer, idx) => (
                                                        <div key={idx}>
                                                            {scorer.player_name || scorer.anonymised_id}
                                                            {scorer.goal_count > 1 && ` (${scorer.goal_count})`}
                                                        </div>
                                                    ))}
                                                    {hasMoreScorers && (
                                                        <div className="text-gray-500 italic">+{(match.scorers?.length || 0) - 4} more</div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-xs text-gray-700 leading-relaxed max-h-12 overflow-hidden">
                                            {assists.length > 0 ? (
                                                <div>
                                                    {assists.map((assist, idx) => (
                                                        <div key={idx}>
                                                            {assist.player_name || assist.anonymised_id}
                                                            {assist.assist_count > 1 && ` (${assist.assist_count})`}
                                                        </div>
                                                    ))}
                                                    {hasMoreAssists && (
                                                        <div className="text-gray-500 italic">+{(match.assists?.length || 0) - 4} more</div>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
