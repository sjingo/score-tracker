"use client";

import { GameType } from "../types";

interface GameTypeSelectProps {
    gameTypeId: string;
    gameTypes: GameType[];
    id: string;
    isPending?: boolean;
    name: string;
    oppositionName: string;
    onChange: (gameType: GameType) => void;
}

export default function GameTypeSelect({
    gameTypeId,
    gameTypes,
    id,
    isPending = false,
    name,
    oppositionName,
    onChange,
}: GameTypeSelectProps) {
    const selectedGameType = gameTypes.find((type) => type.id === gameTypeId);

    return (
        <select
            id={id}
            name={name}
            value={gameTypeId}
            disabled={isPending}
            aria-label={`Game type for Lions vs ${oppositionName}`}
            onChange={(event) => {
                const gameType = gameTypes.find((type) => type.id === event.target.value);
                if (gameType) onChange(gameType);
            }}
            data-game-type={selectedGameType?.type_name || ""}
            className="game-type-select"
        >
            {gameTypes.map((type) => (
                <option key={type.id} value={type.id}>
                    {type.display_name}
                </option>
            ))}
        </select>
    );
}