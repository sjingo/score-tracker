import { useState } from "react";
import { Game, Player } from "../types";
import { PlusIcon } from "@/icons/plus";
import { MinusIcon } from "@/icons/minus";
import Alert from "@/components/Alert";

type AssistPlayer = Pick<Player, "id" | "name"> & {
    jersey_number: number | string;
};

interface AssistsPanelProps {
    game: Game;
    activePlayers: AssistPlayer[];
    selectedGame: string | null;
    selectedPlayer: string | null;
    assistError: string | null;
    onSelectPlayer: (gameId: string, playerId: string) => void;
    onRecordAssist: (gameId: string, assistCount: number, playerId?: string) => void;
    onDeleteAssist: (gameId: string, assistId: string) => void;
}

export default function AssistsPanel({
    game,
    activePlayers,
    selectedGame,
    selectedPlayer,
    assistError,
    onSelectPlayer,
    onRecordAssist,
    onDeleteAssist,
}: AssistsPanelProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const assists = (game.assists || []).filter((assist) => assist.assist_count > 0);

    return (
        <>
            <div className="mb-4">
                <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-semibold sm:text-base">Assists:</h4>
                    <button
                        type="button"
                        aria-expanded={isExpanded}
                        aria-controls={`${game.id}-assists-panel`}
                        onClick={() => setIsExpanded((expanded) => !expanded)}
                        className="text-purple-600 hover:text-purple-800 text-sm"
                    >
                        {isExpanded ? "Hide" : "Show"}
                    </button>
                </div>
                <div id={`${game.id}-assists-panel`}>
                    {isExpanded && (
                        assists.length > 0 ? (
                            <div className="space-y-2">
                                {assists.map((assist) => (
                                    <div
                                        key={assist.id}
                                        className="flex flex-col gap-2 rounded bg-purple-100 p-2 sm:flex-row sm:items-center sm:justify-between sm:p-3"
                                    >
                                        <span>
                                            {assist.player_name}{" "}
                                            {assist.anonymised_id && (
                                                <span className="text-gray-500 text-sm">
                                                    ({assist.anonymised_id})
                                                </span>
                                            )}
                                            <span className="ml-2 rounded bg-purple-500 px-2 py-1 font-bold text-white sm:px-3">
                                                {assist.assist_count}
                                            </span>
                                        </span>
                                        <div className="flex items-center gap-2 self-end sm:self-auto">
                                            <button
                                                type="button"
                                                aria-label={`Add assist for ${assist.player_name}`}
                                                onClick={() => onRecordAssist(game.id, 1, assist.player_id)}
                                                className="text-purple-600 hover:text-purple-800"
                                            >
                                                <PlusIcon className="size-7 sm:size-8" />
                                            </button>
                                            <button
                                                type="button"
                                                aria-label={`Remove assist for ${assist.player_name}`}
                                                onClick={() => onRecordAssist(game.id, -1, assist.player_id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <MinusIcon className="size-7 sm:size-8" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onDeleteAssist(game.id, assist.id)}
                                                className="text-red-600 hover:text-red-900 text-sm"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 italic">No assists yet</p>
                        )
                    )}
                </div>
            </div>

            <div className="rounded bg-purple-50 p-2 sm:p-3">
                <h4 className="mb-3 text-sm font-semibold sm:text-base">🎯 Record Assist:</h4>
                {assistError && (
                    <Alert className="mb-2 rounded border-red-200 bg-red-100 p-2">
                        {assistError}
                    </Alert>
                )}
                <div className="flex gap-2">
                    <select
                        value={selectedGame === game.id ? selectedPlayer || "" : ""}
                        onChange={(event) => onSelectPlayer(game.id, event.target.value)}
                        className="w-full rounded border p-2 text-sm sm:basis-1/2"
                    >
                        <option value="">Select player...</option>
                        {activePlayers.filter((player) => !assists.some((assist) => assist.player_id === player.id)).map((player) => (
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
