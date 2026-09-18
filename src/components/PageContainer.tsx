import type { ReactNode } from "react";

export type PageContainerSize = "wide" | "content" | "narrow";

interface PageContainerProps {
    children: ReactNode;
    size?: PageContainerSize;
    flush?: boolean;
    className?: string;
}

const sizeClasses: Record<PageContainerSize, string> = {
    wide: "max-w-6xl",
    content: "max-w-4xl",
    narrow: "max-w-xl",
};

export default function PageContainer({
    children,
    size = "wide",
    flush = false,
    className = "",
}: PageContainerProps) {
    const spacingClasses = flush ? "px-3 sm:px-4" : "px-3 py-5 sm:px-4 sm:py-8";

    return (
        <div className={`mx-auto w-full ${sizeClasses[size]} ${spacingClasses} ${className}`}>
            {children}
        </div>
    );
}
