import { useState } from "react";
import { Game, Player, OPPOSITION_GOAL } from "../types";
import { PlusIcon } from "@/icons/plus";
import { MinusIcon } from "@/icons/minus";

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
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">Scorers:</h4>
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
                                        className="flex justify-between items-center bg-gray-100 p-3 rounded"
                                    >
                                        <span>
                                            {scorer.player_name}{" "}
                                            {scorer.anonymised_id && (
                                                <span className="text-gray-500 text-sm">
                                                    ({scorer.anonymised_id})
                                                </span>
                                            )}
                                            <span className={`ml-2 font-bold text-white px-3 py-1 rounded ${scorer.player_id === OPPOSITION_GOAL ? "bg-red-500" : "bg-green-500"
                                                }`}>
                                                {scorer.goal_count}
                                            </span>
                                        </span>
                                        {/* <span className="font-bold bg-blue-500 text-white px-3 py-1 rounded">
                                </span> */}
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                aria-label={`Add goal for ${scorer.player_name}`}
                                                onClick={() => onRecordGoal(game.id, 1, scorer.player_id)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                <PlusIcon className="w-8 h-8" />
                                            </button>
                                            <button
                                                type="button"
                                                aria-label={`Remove goal for ${scorer.player_name}`}
                                                onClick={() => onRecordGoal(game.id, -1, scorer.player_id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <MinusIcon className="w-8 h-8" />
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

            <div className="bg-gray-50 p-2 rounded mb-4">
                <h4 className="font-semibold mb-3">⚽ Record Goal:</h4>
                {scoringError && (
                    <div className="bg-red-100 text-red-700 p-2 rounded mb-2 text-sm">
                        {scoringError}
                    </div>
                )}
                <div className="flex gap-2">
                    <select
                        value={selectedGame === game.id ? selectedPlayer || "" : ""}
                        onChange={(event) => onSelectPlayer(game.id, event.target.value)}
                        className="basis-1/2 border p-2 rounded bg-white"
                    >
                        <option value="">Select player...</option>
                        {activePlayers.map((player) => (
                            <option key={player.id} value={player.id}>
                                {player.name}
                                {player.jersey_number ? ` (#${player.jersey_number})` : ""}
                            </option>
                        ))}
                    </select>
                    <div className="flex items-center gap-2 basis-1/2">
                        <PlusIcon
                            className="w-10 h-10 text-blue-600"
                            onClick={() => onRecordGoal(game.id, 1)}
                        />
                        <MinusIcon
                            className="w-10 h-10 text-red-600"
                            onClick={() => onRecordGoal(game.id, -1)}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
