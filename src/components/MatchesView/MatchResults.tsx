"use client";

import { useState } from 'react';
import { Game, GameType } from '../types';
import TableShell from './TableShell';

interface MatchResultsProps {
    matches: Game[];
    gameType?: GameType;
}

export default function MatchResults({ matches, gameType }: MatchResultsProps) {
    const [selectedMatch, setSelectedMatch] = useState<Game | null>(null);
    const [copied, setCopied] = useState(false);

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

    const truncateScorers = (scorers: Array<{ player_name?: string; anonymised_id?: string; goal_count?: number; assist_count?: number; save_count?: number }>) => {
        if (!scorers || scorers.length === 0) return [];
        // Show all scorers - no truncation
        return scorers;
    };

    const formatPlayers = (players: Array<{ player_name?: string; anonymised_id?: string; goal_count?: number; assist_count?: number; save_count?: number }> | undefined, countKey: 'goal_count' | 'assist_count' | 'save_count') => {
        if (!players || players.length === 0) return 'None';

        return players
            .map((player) => {
                const name = player.player_name || player.anonymised_id || 'Unknown player';
                const count = player[countKey];
                return count && count > 1 ? `${name} (${count})` : name;
            })
            .join(', ');
    };

    const getMatchSummary = (match: Game) => {
        const result = getResultBadge(match.score_for, match.score_against).text;
        const date = new Date(match.match_date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });

        return [
            `Lions vs ${match.opposition_name}`,
            `Date: ${date}`,
            `Score: ${match.score_for} - ${match.score_against} (${result})`,
            match.game_type_display ? `Competition: ${match.game_type_display}` : null,
            match.location ? `Location: ${match.location}` : null,
            `Scorers: ${formatPlayers(match.scorers, 'goal_count')}`,
            `Assists: ${formatPlayers(match.assists, 'assist_count')}`,
            `Saves: ${formatPlayers(match.saves, 'save_count')}`,
        ].filter(Boolean).join('\n');
    };

    const openSummary = (match: Game) => {
        setSelectedMatch(match);
        setCopied(false);
    };

    const closeSummary = () => {
        setSelectedMatch(null);
        setCopied(false);
    };

    const copySummary = async () => {
        if (!selectedMatch) return;

        const summary = getMatchSummary(selectedMatch);
        try {
            await navigator.clipboard.writeText(summary);
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = summary;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
        setCopied(true);
    };

    return (
        <>
            <TableShell gameType={gameType} titleSuffix=" - Results">
                <table className="w-full min-w-[900px]">
                    <thead className="bg-gray-100 border-b border-salts-blue">
                        <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-700 sm:px-6 sm:py-3">Match</th>
                            <th className="px-3 py-2 text-center text-xs font-medium uppercase text-gray-700 sm:px-6 sm:py-3">Score</th>
                            <th className="px-3 py-2 text-center text-xs font-medium uppercase text-gray-700 sm:px-6 sm:py-3">Result</th>
                            <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-700 sm:px-6 sm:py-3">Scorers</th>
                            <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-700 sm:px-6 sm:py-3">Assists</th>
                            <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-700 sm:px-6 sm:py-3">Saves</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {completed.map((match) => {
                            const result = getResultBadge(match.score_for, match.score_against);
                            const scorers = truncateScorers(match.scorers || []);
                            const assists = truncateScorers(match.assists || []);
                            const saves = truncateScorers(match.saves || []);
                            const hasMoreScorers = false;
                            const hasMoreAssists = false;
                            const hasMoreSaves = false;

                            return (
                                <tr key={match.id} className="hover:bg-gray-50">
                                    <td className="px-3 py-3 sm:px-6 sm:py-4">
                                        <button
                                            type="button"
                                            onClick={() => openSummary(match)}
                                            className="text-left text-sm font-medium text-salts-blue underline decoration-salts-blue/40 underline-offset-2 hover:text-blue-700 hover:decoration-blue-700 focus:outline-none focus:ring-2 focus:ring-salts-blue focus:ring-offset-2"
                                            title="Open copyable match summary"
                                        >
                                            Lions vs {match.opposition_name}
                                        </button>
                                        <div className="mt-1 text-sm font-semibold text-gray-500">
                                            {new Date(match.match_date).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 text-center sm:px-6 sm:py-4">
                                        <div className="whitespace-nowrap text-lg font-bold text-gray-900">
                                            {match.score_for} - {match.score_against}
                                        </div>
                                    </td>
                                    <td className="px-3 py-3 text-center sm:px-6 sm:py-4">
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${result.color}`}>
                                            {result.text}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 sm:px-6 sm:py-4">
                                        <div className="text-xs text-gray-700 leading-relaxed">
                                            {scorers.length > 0 ? (
                                                <div>
                                                    {scorers.map((scorer, idx) => (
                                                        <div key={idx}>
                                                            {scorer.player_name || scorer.anonymised_id}
                                                            {scorer.goal_count !== undefined && scorer.goal_count > 1 && ` (${scorer.goal_count})`}
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
                                    <td className="px-3 py-3 sm:px-6 sm:py-4">
                                        <div className="text-xs text-gray-700 leading-relaxed">
                                            {assists.length > 0 ? (
                                                <div>
                                                    {assists.map((assist, idx) => (
                                                        <div key={idx}>
                                                            {assist.player_name || assist.anonymised_id}
                                                            {assist.assist_count !== undefined && assist.assist_count > 1 && ` (${assist.assist_count})`}
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
                                    <td className="px-3 py-3 sm:px-6 sm:py-4">
                                        <div className="text-xs text-gray-700 leading-relaxed">
                                            {saves.length > 0 ? (
                                                <div>
                                                    {saves.map((save, idx) => (
                                                        <div key={idx}>
                                                            {save.player_name || save.anonymised_id}
                                                            {save.save_count !== undefined && save.save_count > 1 && ` (${save.save_count})`}
                                                        </div>
                                                    ))}
                                                    {hasMoreSaves && (
                                                        <div className="text-gray-500 italic">+{(match.saves?.length || 0) - 4} more</div>
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
            </TableShell>
            {selectedMatch && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                    role="presentation"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) closeSummary();
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="match-summary-title"
                        className="w-full max-w-lg rounded-lg bg-white p-4 shadow-xl sm:p-6"
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 id="match-summary-title" className="text-lg font-semibold text-gray-900">Match summary</h2>
                                <p className="mt-1 text-sm text-gray-500">Copy this summary to share the match stats.</p>
                            </div>
                            <button
                                type="button"
                                onClick={closeSummary}
                                className="text-sm font-medium text-gray-400 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-salts-blue"
                                aria-label="Close match summary"
                            >
                                Close
                            </button>
                        </div>
                        <textarea
                            readOnly
                            value={getMatchSummary(selectedMatch)}
                            onFocus={(event) => event.currentTarget.select()}
                            className="mt-4 min-h-48 w-full resize-y rounded border border-gray-300 p-3 text-sm text-gray-800 focus:border-salts-blue focus:outline-none focus:ring-2 focus:ring-salts-blue"
                            aria-label="Copyable match summary"
                        />
                        <div className="mt-4 flex flex-wrap justify-end gap-2 sm:gap-3">
                            <button
                                type="button"
                                onClick={closeSummary}
                                className="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-salts-blue"
                            >
                                Close
                            </button>
                            <button
                                type="button"
                                onClick={copySummary}
                                className="rounded bg-salts-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-salts-blue focus:ring-offset-2"
                            >
                                {copied ? 'Copied' : 'Copy summary'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
