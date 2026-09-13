import type { MouseEventHandler } from "react";
import { SyncIcon } from "@/icons/sync";

interface SyncButtonProps {
    onClick: MouseEventHandler<HTMLButtonElement>;
    disabled: boolean;
    isSyncing: boolean;
    title: string;
}

export default function SyncButton({ onClick, disabled, isSyncing, title }: SyncButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className="inline-flex items-center gap-2 rounded p-2 text-white disabled:opacity-60"
            title={title}
        >
            <SyncIcon className={`stroke-salts-blue size-10 ${isSyncing ? "animate-spin" : ""}`} />
        </button>
    );
}