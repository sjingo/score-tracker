import { Game } from '../types';

interface MatchFormProps {
    matches: Game[];
}

export default function MatchForm({ matches }: MatchFormProps) {
    const form = [...matches]
        .filter((match) => match.status === 'completed')
        .sort((a, b) => new Date(b.match_date).getTime() - new Date(a.match_date).getTime())
        .slice(0, 5)
        .reverse();

    return (
        <div className="flex gap-1">
            {form.map((match) => {
                const result = match.score_for > match.score_against
                    ? { text: 'W', color: 'bg-green-500' }
                    : match.score_for === match.score_against
                        ? { text: 'D', color: 'bg-amber-500' }
                        : { text: 'L', color: 'bg-red-500' };

                return (
                    <div
                        key={match.id}
                        className={`w-7 h-7 rounded flex items-center justify-center text-xs font-bold text-white ${result.color}`}
                        title={new Date(match.match_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                        })}
                    >
                        {result.text}
                    </div>
                );
            })}
        </div>
    );
}