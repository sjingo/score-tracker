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
            className={`flex min-h-28 items-center justify-center gap-2 px-3 py-6 text-salts-blue sm:min-h-32 sm:gap-3 sm:px-4 sm:py-8 ${className}`}
            role="status"
            aria-live="polite"
        >
            <span className="size-7 animate-spin rounded-full border-4 border-blue-100 border-t-salts-blue sm:size-8" />
            <span className="text-sm font-medium text-gray-600">{label}</span>
        </div>
    );
}