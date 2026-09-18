import { Game, GameType } from '../types';
import MatchForm from './MatchForm';
import Alert from '@/components/Alert';
import TableShell from './TableShell';

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

    return {
        played: completed.length,
        won,
        drawn,
        lost,
        goalsFor,
        goalsAgainst,
        goalDifference: goalsFor - goalsAgainst,
    };
}

export default function LeagueTable({ matches, gameType, teamName = 'Lions' }: LeagueTableProps) {
    const stats = calculateStats(matches);

    if (stats.played === 0) {
        return (
            <Alert tone="info" className="rounded-lg border-0 p-4 text-center sm:p-6">
                No completed matches found
            </Alert>
        );
    }

    return (
        <TableShell gameType={gameType}>
            <table className="w-full min-w-[720px]">
                <thead className="bg-gray-100 border-b border-salts-blue">
                    <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-700 sm:px-6 sm:py-3">Team</th>
                        <th className="px-3 py-2 text-center text-xs font-medium uppercase text-gray-700 sm:px-6 sm:py-3">P</th>
                        <th className="px-3 py-2 text-center text-xs font-medium uppercase text-gray-700 sm:px-6 sm:py-3">W</th>
                        <th className="px-3 py-2 text-center text-xs font-medium uppercase text-gray-700 sm:px-6 sm:py-3">D</th>
                        <th className="px-3 py-2 text-center text-xs font-medium uppercase text-gray-700 sm:px-6 sm:py-3">L</th>
                        <th className="px-3 py-2 text-center text-xs font-medium uppercase text-gray-700 sm:px-6 sm:py-3">For</th>
                        <th className="px-3 py-2 text-center text-xs font-medium uppercase text-gray-700 sm:px-6 sm:py-3">Against</th>
                        <th className="px-3 py-2 text-center text-xs font-medium uppercase text-gray-700 sm:px-6 sm:py-3">GD</th>
                        <th className="px-3 py-2 text-left text-xs font-medium uppercase text-gray-700 sm:px-6 sm:py-3">Form</th>
                    </tr>
                </thead>
                <tbody>
                    <tr className="hover:bg-gray-50 border-b border-salts-blue">
                        <td className="px-3 py-3 text-sm font-semibold text-gray-900 sm:px-6 sm:py-4">{teamName}</td>
                        <td className="px-3 py-3 text-center text-sm font-medium text-gray-900 sm:px-6 sm:py-4">{stats.played}</td>
                        <td className="px-3 py-3 text-center text-sm font-medium text-green-600 sm:px-6 sm:py-4">{stats.won}</td>
                        <td className="px-3 py-3 text-center text-sm font-medium text-amber-600 sm:px-6 sm:py-4">{stats.drawn}</td>
                        <td className="px-3 py-3 text-center text-sm font-medium text-red-600 sm:px-6 sm:py-4">{stats.lost}</td>
                        <td className="px-3 py-3 text-center text-sm font-medium text-blue-600 sm:px-6 sm:py-4">{stats.goalsFor}</td>
                        <td className="px-3 py-3 text-center text-sm font-medium text-blue-600 sm:px-6 sm:py-4">{stats.goalsAgainst}</td>
                        <td className="px-3 py-3 text-center text-sm font-semibold text-gray-900 sm:px-6 sm:py-4">
                            {stats.goalDifference > 0 ? '+' : ''}{stats.goalDifference}
                        </td>
                        <td className="px-3 py-3 sm:px-6 sm:py-4">
                            <MatchForm matches={matches} />
                        </td>
                    </tr>
                </tbody>
            </table>
        </TableShell>
    );
}
