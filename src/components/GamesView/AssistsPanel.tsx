import { useState } from "react";
import { Game, Player } from "../types";
import { PlusIcon } from "@/icons/plus";
import { MinusIcon } from "@/icons/minus";

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
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">Assists:</h4>
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
                                        className="flex justify-between items-center bg-purple-100 p-3 rounded"
                                    >
                                        <span>
                                            {assist.player_name}{" "}
                                            {assist.anonymised_id && (
                                                <span className="text-gray-500 text-sm">
                                                    ({assist.anonymised_id})
                                                </span>
                                            )}
                                            <span className="ml-2 font-bold bg-purple-500 text-white px-3 py-1 rounded">
                                                {assist.assist_count}
                                            </span>
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                aria-label={`Add assist for ${assist.player_name}`}
                                                onClick={() => onRecordAssist(game.id, 1, assist.player_id)}
                                                className="text-purple-600 hover:text-purple-800"
                                            >
                                                <PlusIcon className="w-8 h-8" />
                                            </button>
                                            <button
                                                type="button"
                                                aria-label={`Remove assist for ${assist.player_name}`}
                                                onClick={() => onRecordAssist(game.id, -1, assist.player_id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <MinusIcon className="w-8 h-8" />
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

            <div className="bg-purple-50 p-2 rounded">
                <h4 className="font-semibold mb-3">🎯 Record Assist:</h4>
                {assistError && (
                    <div className="bg-red-100 text-red-700 p-2 rounded mb-2 text-sm">
                        {assistError}
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
                            className="w-10 h-10 text-purple-600"
                            onClick={() => onRecordAssist(game.id, 1)}
                        />
                        <MinusIcon
                            className="w-10 h-10 text-red-600"
                            onClick={() => onRecordAssist(game.id, -1)}
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
