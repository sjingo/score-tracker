import type { ReactNode } from "react";

export type SurfaceVariant = "card" | "panel" | "muted";

interface SurfaceProps {
    children: ReactNode;
    variant?: SurfaceVariant;
    className?: string;
}

const variantClasses: Record<SurfaceVariant, string> = {
    card: "bg-white shadow-md",
    panel: "bg-salts-blue text-white shadow",
    muted: "bg-gray-50",
};

export default function Surface({
    children,
    variant = "card",
    className = "",
}: SurfaceProps) {
    return (
        <div className={`rounded-lg ${variantClasses[variant]} ${className}`}>
            {children}
        </div>
    );
}
