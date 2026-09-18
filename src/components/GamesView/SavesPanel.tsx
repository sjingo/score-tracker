import { useState } from "react";
import { Game, Player } from "../types";
import { PlusIcon } from "@/icons/plus";
import { MinusIcon } from "@/icons/minus";
import GameSaveSelect from "./GameSaveSelect";
import Alert from "@/components/Alert";

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
                <div className="mb-2 flex items-center justify-between">
                    <h4 className="text-sm font-semibold sm:text-base">Saves:</h4>
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
                                    <div key={save.id} className="flex flex-col gap-2 rounded bg-blue-100 p-2 sm:flex-row sm:items-center sm:justify-between sm:p-3">
                                        <span>
                                            {save.player_name}{" "}
                                            {save.anonymised_id && <span className="text-gray-500 text-sm">({save.anonymised_id})</span>}
                                            <span className="ml-2 rounded bg-salts-blue px-2 py-1 font-bold text-amber-200 sm:px-3">{save.save_count}</span>
                                        </span>
                                        <div className="flex items-center gap-2 self-end sm:self-auto">
                                            <button type="button" aria-label={`Add save for ${save.player_name}`} onClick={() => onRecordSave(game.id, 1, save.player_id)} className="text-blue-600 hover:text-blue-800">
                                                <PlusIcon className="size-7 sm:size-8" />
                                            </button>
                                            <button type="button" aria-label={`Remove save for ${save.player_name}`} onClick={() => onRecordSave(game.id, -1, save.player_id)} className="text-red-600 hover:text-red-800">
                                                <MinusIcon className="size-7 sm:size-8" />
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

            <div className="rounded bg-blue-50 p-2 sm:p-3">
                <h4 className="mb-3 text-sm font-semibold sm:text-base">Record Save:</h4>
                {saveError && <Alert className="mb-2 rounded border-red-200 bg-red-100 p-2">{saveError}</Alert>}
                <div className="flex gap-2">
                    <GameSaveSelect
                        activePlayers={activePlayers.filter((player) => !saves.some((save) => save.player_id === player.id))}
                        gameId={game.id}
                        id={`game-save-player-${game.id}`}
                        name={`game-save-player-${game.id}`}
                        selectedGame={selectedGame}
                        selectedPlayer={selectedPlayer}
                        onChange={onSelectPlayer}
                    />
                </div>
            </div>
        </>
    );
}