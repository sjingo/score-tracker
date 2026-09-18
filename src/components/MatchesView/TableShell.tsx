import type { ReactNode } from "react";
import type { GameType } from "../types";
import Surface from "@/components/Surface";

interface TableShellProps {
    children: ReactNode;
    gameType?: GameType;
    titleSuffix?: string;
}

export default function TableShell({ children, gameType, titleSuffix = "" }: TableShellProps) {
    return (
        <Surface className="overflow-hidden">
            {gameType && (
                <div className="border-b border-salts-blue bg-gray-50 px-3 py-2 sm:px-6 sm:py-3">
                    <h3 className="flex items-center gap-2 font-semibold text-gray-900">
                        <span
                            className="size-3 shrink-0 rounded-full"
                            style={{ backgroundColor: gameType.color || "#999" }}
                        />
                        {gameType.display_name}{titleSuffix}
                    </h3>
                </div>
            )}
            <div className="overflow-x-auto">{children}</div>
        </Surface>
    );
}
