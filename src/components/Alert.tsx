import type { ReactNode } from "react";

export type AlertTone = "error" | "success" | "warning" | "info";

interface AlertProps {
    children: ReactNode;
    tone?: AlertTone;
    role?: "alert" | "status";
    className?: string;
}

const toneClasses: Record<AlertTone, string> = {
    error: "border-red-200 bg-red-50 text-red-700",
    success: "border-green-200 bg-green-50 text-green-700",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    info: "border-blue-200 bg-blue-50 text-blue-700",
};

export default function Alert({
    children,
    tone = "error",
    role = "alert",
    className = "",
}: AlertProps) {
    return (
        <div role={role} className={`rounded border p-3 text-sm ${toneClasses[tone]} ${className}`}>
            {children}
        </div>
    );
}
