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
                className="border border-gray-300 rounded px-1 py-0.5 bg-white text-gray-700"
            >
                <option value="">Select location</option>
                <option value="home">Home</option>
                <option value="away">Away</option>
            </select>
        </label>
    );
}