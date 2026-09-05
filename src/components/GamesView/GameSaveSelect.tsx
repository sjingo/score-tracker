"use client";

interface SavePlayer {
    id: string;
    name: string;
    jersey_number: number | string;
}

interface GameSaveSelectProps {
    activePlayers: SavePlayer[];
    gameId: string;
    id: string;
    name: string;
    selectedGame: string | null;
    selectedPlayer: string | null;
    onChange: (gameId: string, playerId: string) => void;
}

export default function GameSaveSelect({
    activePlayers,
    gameId,
    id,
    name,
    selectedGame,
    selectedPlayer,
    onChange,
}: GameSaveSelectProps) {
    return (
        <select
            id={id}
            name={name}
            value={selectedGame === gameId ? selectedPlayer || "" : ""}
            onChange={(event) => onChange(gameId, event.target.value)}
            aria-label={`Save player for game ${gameId}`}
            className="basis-1/2 border p-2 rounded bg-white"
        >
            <option value="">Select player...</option>
            {activePlayers.map((player) => (
                <option key={player.id} value={player.id}>
                    {player.name}{player.jersey_number ? ` (#${player.jersey_number})` : ""}
                </option>
            ))}
        </select>
    );
}