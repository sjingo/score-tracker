import { useState } from "react";
import { Game, Player, OPPOSITION_GOAL } from "../types";
import { PlusIcon } from "@/icons/plus";
import { MinusIcon } from "@/icons/minus";
import Alert from "@/components/Alert";

type ScorerPlayer = Pick<Player, "id" | "name"> & {
    jersey_number: number | string;
};

interface ScorersPanelProps {
    game: Game;
    activePlayers: ScorerPlayer[];
    selectedGame: string | null;
    selectedPlayer: string | null;
    scoringError: string | null;
    onSelectPlayer: (gameId: string, playerId: string) => void;
    onRecordGoal: (gameId: string, goalCount: number, playerId?: string) => void;
    onDeleteScorer: (gameId: string, scorerId: string) => void;
}

export default function ScorersPanel({
    game,
    activePlayers,
    selectedGame,
    selectedPlayer,
    scoringError,
    onSelectPlayer,
    onRecordGoal,
    onDeleteScorer,
}: ScorersPanelProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const scorers = (game.scorers || []).filter((scorer) => scorer.goal_count > 0);
    const scorerRows = game.score_against > 0
        ? [
            ...scorers,
            {
                id: OPPOSITION_GOAL,
                player_id: OPPOSITION_GOAL,
                player_name: OPPOSITION_GOAL,
                goal_count: game.score_against,
            },
        ]
        : scorers;

    return (
        <>
            <div className="mb-4">
                <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-semibold sm:text-base">Scorers:</h4>
                    <button
                        type="button"
                        aria-expanded={isExpanded}
                        aria-controls={`${game.id}-scorers-panel`}
                        onClick={() => setIsExpanded((expanded) => !expanded)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                        {isExpanded ? "Hide" : "Show"}
                    </button>
                </div>
                <div id={`${game.id}-scorers-panel`}>
                    {isExpanded && (
                        scorerRows.length > 0 ? (
                            <div className="space-y-2">
                                {scorerRows.map((scorer) => (
                                    <div
                                        key={scorer.id}
                                        className="flex flex-col gap-2 rounded bg-gray-100 p-2 sm:flex-row sm:items-center sm:justify-between sm:p-3"
                                    >
                                        <span>
                                            {scorer.player_name}{" "}
                                            {scorer.anonymised_id && (
                                                <span className="text-gray-500 text-sm">
                                                    ({scorer.anonymised_id})
                                                </span>
                                            )}
                                            <span className={`ml-2 rounded px-2 py-1 font-bold text-white sm:px-3 ${scorer.player_id === OPPOSITION_GOAL ? "bg-red-500" : "bg-green-500"
                                                }`}>
                                                {scorer.goal_count}
                                            </span>
                                        </span>
                                        {/* <span className="font-bold bg-salts-blue text-white px-3 py-1 rounded">
                                </span> */}
                                        <div className="flex items-center gap-2 self-end sm:self-auto">
                                            <button
                                                type="button"
                                                aria-label={`Add goal for ${scorer.player_name}`}
                                                onClick={() => onRecordGoal(game.id, 1, scorer.player_id)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <PlusIcon className="size-7 sm:size-8" />
                                            </button>
                                            <button
                                                type="button"
                                                aria-label={`Remove goal for ${scorer.player_name}`}
                                                onClick={() => onRecordGoal(game.id, -1, scorer.player_id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <MinusIcon className="size-7 sm:size-8" />
                                            </button>
                                            {scorer.player_id !== OPPOSITION_GOAL && (
                                                <button
                                                    onClick={() => onDeleteScorer(game.id, scorer.id)}
                                                    className="text-red-600 hover:text-red-900 text-sm"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 italic">No scorers yet</p>
                        )
                    )}
                </div>
            </div>

            <div className="mb-4 rounded bg-gray-50 p-2 sm:p-3">
                <h4 className="mb-3 text-sm font-semibold sm:text-base">⚽ Record Goal:</h4>
                {scoringError && (
                    <Alert className="mb-2 rounded border-red-200 bg-red-100 p-2">
                        {scoringError}
                    </Alert>
                )}
                <div className="flex gap-2">
                    <select
                        value={selectedGame === game.id ? selectedPlayer || "" : ""}
                        onChange={(event) => onSelectPlayer(game.id, event.target.value)}
                        className="w-full rounded border p-2 text-sm sm:basis-1/2"
                    >
                        <option value="">Select player...</option>
                        {activePlayers.filter((player) => !scorers.some((scorer) => scorer.player_id === player.id)).map((player) => (
                            <option key={player.id} value={player.id}>
                                {player.name}
                                {player.jersey_number ? ` (#${player.jersey_number})` : ""}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </>
    );
}
