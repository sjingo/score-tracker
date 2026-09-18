import type { ReactNode } from "react";

interface SectionHeadingProps {
    title: ReactNode;
    description?: ReactNode;
    className?: string;
}

export default function SectionHeading({
    title,
    description,
    className = "",
}: SectionHeadingProps) {
    return (
        <div className={`mb-4 ${className}`}>
            <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">{title}</h2>
            {description && <p className="mt-1 text-sm text-gray-600">{description}</p>}
        </div>
    );
}
