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
            className="rounded border border-gray-300 px-1.5 py-0.5 text-xs text-gray-900 sm:px-2 sm:py-1 sm:text-sm"
        />
    );
}
