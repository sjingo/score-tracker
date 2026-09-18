"use client";

interface LocationSelectProps {
    id: string;
    isPending?: boolean;
    location?: string;
    name: string;
    oppositionName: string;
    onChange: (location: string) => void;
}

export default function LocationSelect({
    id,
    isPending = false,
    location,
    name,
    oppositionName,
    onChange,
}: LocationSelectProps) {
    return (
        <label className="flex items-center gap-1">
            <select
                id={id}
                name={name}
                aria-label={`Location for Lions vs ${oppositionName}`}
                value={location || ""}
                disabled={isPending}
                onChange={(event) => onChange(event.target.value)}
                className="rounded border border-gray-300 bg-white px-1.5 py-0.5 text-xs text-gray-700 sm:px-2 sm:py-1 sm:text-sm"
            >
                <option value="">Select location</option>
                <option value="home">Home</option>
                <option value="away">Away</option>
            </select>
        </label>
    );
}