import { useState } from "react";
import { Game } from "../types";
import {
    SHOT_OPTIONS,
    ShotType,
} from "@/app/api/games/hooks/useGameShotMutation";
import { useGameShotsQuery } from "@/app/api/games/hooks/useGameShotsQuery";

interface ShotsPanelProps {
    game: Game;
    shotError: string | null;
    isPending: boolean;
    onRecordShot: (shotType: ShotType) => void;
    onEditShot: (shotId: string, shotType: ShotType) => void;
    onDeleteShot: (shotId: string) => void;
}

export default function ShotsPanel({
    game,
    shotError,
    isPending,
    onRecordShot,
    onEditShot,
    onDeleteShot,
}: ShotsPanelProps) {
    const [isExpanded, setIsExpanded] = useState(true);
    const [editingShotId, setEditingShotId] = useState<string | null>(null);
    const { data: shots = [], isLoading } = useGameShotsQuery(game.id);

    return (
        <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold">Shots:</h4>
                <button
                    type="button"
                    aria-expanded={isExpanded}
                    aria-controls={`${game.id}-shots-panel`}
                    onClick={() => setIsExpanded((expanded) => !expanded)}
                    className="text-teal-700 hover:text-teal-800 text-sm"
                >
                    {isExpanded ? "Hide" : "Show"}
                </button>
            </div>
            {isExpanded && (
                <div id={`${game.id}-shots-panel`} className="bg-teal-50 p-3 rounded">
                    {shotError && <div className="bg-red-100 text-red-700 p-2 rounded mb-2 text-sm">{shotError}</div>}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {SHOT_OPTIONS.map((option) => (
                            <button
                                key={option.type}
                                type="button"
                                disabled={isPending}
                                onClick={() => onRecordShot(option.type)}
                                className="rounded bg-teal-700 px-3 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <span className="block">{option.label}</span>
                                <span className="block text-xs font-normal">{option.xg.toFixed(2)} xG</span>
                            </button>
                        ))}
                    </div>
                    <div className="space-y-2">
                        {isLoading ? <p className="text-sm text-gray-600">Loading shots...</p> : null}
                        {!isLoading && shots.length === 0 ? <p className="text-sm italic text-gray-600">No shots recorded</p> : null}
                        {shots.map((shot, index) => {
                            const option = SHOT_OPTIONS.find((item) => item.type === shot.shot_type);
                            const isEditing = editingShotId === shot.id;

                            return (
                                <div key={shot.id} className="rounded bg-white p-2 text-sm">
                                    <div className="flex items-center justify-between gap-2">
                                        <span>Shot {shots.length - index}: {option?.label} ({shot.xg_value.toFixed(2)} xG)</span>
                                        <div className="flex gap-2">
                                            <button type="button" className="text-teal-700 hover:text-teal-900" onClick={() => setEditingShotId(isEditing ? null : shot.id)}>
                                                {isEditing ? "Cancel" : "Edit"}
                                            </button>
                                            <button type="button" className="text-red-600 hover:text-red-800" onClick={() => onDeleteShot(shot.id)}>
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                    {isEditing && (
                                        <div className="mt-2 grid grid-cols-2 gap-2">
                                            {SHOT_OPTIONS.map((editOption) => (
                                                <button
                                                    key={editOption.type}
                                                    type="button"
                                                    onClick={() => {
                                                        onEditShot(shot.id, editOption.type);
                                                        setEditingShotId(null);
                                                    }}
                                                    className="rounded border border-teal-300 px-2 py-2 text-xs hover:bg-teal-100"
                                                >
                                                    {editOption.label} ({editOption.xg.toFixed(2)})
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}