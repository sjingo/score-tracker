import type { ReactNode } from "react";

interface PageHeaderProps {
    title: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    className?: string;
}

export default function PageHeader({
    title,
    description,
    actions,
    className = "",
}: PageHeaderProps) {
    return (
        <header className={`mb-4 flex items-start justify-between gap-3 sm:mb-6 sm:gap-4 ${className}`}>
            <div className="min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{title}</h1>
                {description && <div className="mt-1 text-sm text-gray-600 sm:mt-2">{description}</div>}
            </div>
            {actions && <div className="shrink-0">{actions}</div>}
        </header>
    );
}
