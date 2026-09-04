import { AuthStatus } from "./AuthStatus"
{/* Header */ }
export const Header = ({
    auth = true
}: { auth?: boolean }) =>
    <header className="bg-white fixed inset-x-0 top-0 z-10 border-b border-gray-950/5 dark:border-white/10">
        <div className="basis-full flex justify-center items-center">
            <h1 className="text-center text-lg font-bold text-blue-600 ">Lions Score Tracker</h1>
        </div>
        <div className="basis-full flex justify-end items-center m-4">
            {auth && <AuthStatus />}
        </div>

    </header>