import { AuthStatus } from "./AuthStatus"
{/* Header */ }
export const Header = ({
    auth = true
}: { auth?: boolean }) =>
    <header className="bg-white fixed inset-x-0 top-0 z-10 border-b border-gray-950/5 dark:border-white/10">
        <div className="flex space-between items-center max-w-6xl mx-auto px-4 py-4">
            <div className="basis-2/3 flex flex-col">
                <h1 className="text-sm text-blue-400 ">Lions Score Tracker</h1>
            </div>
            <div>
                {auth && <AuthStatus />}
            </div>
        </div>

    </header>