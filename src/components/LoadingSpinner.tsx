interface LoadingSpinnerProps {
    label?: string;
    className?: string;
}

export default function LoadingSpinner({
    label = "Loading...",
    className = "",
}: LoadingSpinnerProps) {
    return (
        <div
            className={`flex min-h-32 items-center justify-center gap-3 px-4 py-8 text-salts-blue ${className}`}
            role="status"
            aria-live="polite"
        >
            <span className="size-8 animate-spin rounded-full border-4 border-blue-100 border-t-salts-blue" />
            <span className="text-sm font-medium text-gray-600">{label}</span>
        </div>
    );
}