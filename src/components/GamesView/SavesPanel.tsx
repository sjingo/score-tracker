import { useState } from "react";
import { Game, Player } from "../types";
import { PlusIcon } from "@/icons/plus";
import { MinusIcon } from "@/icons/minus";
import GameSaveSelect from "./GameSaveSelect";

type SavePlayer = Pick<Player, "id" | "name"> & {
    jersey_number: number | string;
};

interface SavesPanelProps {
    game: Game;
    activePlayers: SavePlayer[];
    selectedGame: string | null;
    selectedPlayer: string | null;
    saveError: string | null;
    onSelectPlayer: (gameId: string, playerId: string) => void;
    onRecordSave: (gameId: string, saveCount: number, playerId?: string) => void;
    onDeleteSave: (gameId: string, saveId: string) => void;
}

export default function SavesPanel({
    game,
    activePlayers,
    selectedGame,
    selectedPlayer,
    saveError,
    onSelectPlayer,
    onRecordSave,
    onDeleteSave,
}: SavesPanelProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const saves = (game.saves || []).filter((save) => save.save_count > 0);

    return (
        <>
            <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold">Saves:</h4>
                    <button
                        type="button"
                        aria-expanded={isExpanded}
                        aria-controls={`${game.id}-saves-panel`}
                        onClick={() => setIsExpanded((expanded) => !expanded)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                        {isExpanded ? "Hide" : "Show"}
                    </button>
                </div>
                <div id={`${game.id}-saves-panel`}>
                    {isExpanded && (
                        saves.length > 0 ? (
                            <div className="space-y-2">
                                {saves.map((save) => (
                                    <div key={save.id} className="flex justify-between items-center bg-blue-100 p-3 rounded">
                                        <span>
                                            {save.player_name}{" "}
                                            {save.anonymised_id && <span className="text-gray-500 text-sm">({save.anonymised_id})</span>}
                                            <span className="ml-2 font-bold bg-blue-500 text-white px-3 py-1 rounded">{save.save_count}</span>
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <button type="button" aria-label={`Add save for ${save.player_name}`} onClick={() => onRecordSave(game.id, 1, save.player_id)} className="text-blue-600 hover:text-blue-800">
                                                <PlusIcon className="w-8 h-8" />
                                            </button>
                                            <button type="button" aria-label={`Remove save for ${save.player_name}`} onClick={() => onRecordSave(game.id, -1, save.player_id)} className="text-red-600 hover:text-red-800">
                                                <MinusIcon className="w-8 h-8" />
                                            </button>
                                            <button type="button" onClick={() => onDeleteSave(game.id, save.id)} className="text-red-600 hover:text-red-900 text-sm">
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-gray-500 italic">No saves yet</p>
                    )}
                </div>
            </div>

            <div className="bg-blue-50 p-2 rounded">
                <h4 className="font-semibold mb-3">Record Save:</h4>
                {saveError && <div className="bg-red-100 text-red-700 p-2 rounded mb-2 text-sm">{saveError}</div>}
                <div className="flex gap-2">
                    <GameSaveSelect
                        activePlayers={activePlayers}
                        gameId={game.id}
                        id={`game-save-player-${game.id}`}
                        name={`game-save-player-${game.id}`}
                        selectedGame={selectedGame}
                        selectedPlayer={selectedPlayer}
                        onChange={onSelectPlayer}
                    />
                    <div className="flex items-center gap-2 basis-1/2">
                        <PlusIcon className="w-10 h-10 text-blue-600" onClick={() => onRecordSave(game.id, 1)} />
                        <MinusIcon className="w-10 h-10 text-red-600" onClick={() => onRecordSave(game.id, -1)} />
                    </div>
                </div>
            </div>
        </>
    );
}