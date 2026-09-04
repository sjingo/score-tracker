"use client";

interface GameDatePickerProps {
    date: string;
    id: string;
    name: string;
    onChange: (date: string) => void;
    isPending?: boolean;
}

export default function GameDatePicker({
    date,
    id,
    name,
    onChange,
    isPending = false,
}: GameDatePickerProps) {
    return (
        <input
            type="date"
            id={id}
            name={name}
            value={date.slice(0, 10)}
            onChange={(event) => onChange(event.target.value)}
            disabled={isPending}
            aria-label="Game date"
            className="border border-gray-300 rounded px-2 py-1 text-sm text-gray-900"
        />
    );
}
