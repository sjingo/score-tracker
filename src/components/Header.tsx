import { HomeIcon } from "@/icons/home"
import { AuthStatus } from "./AuthStatus"
import Link from "next/link"
{/* Header */ }
export const Header = ({
    auth = true
}: { auth?: boolean }) =>
    <header className="bg-white fixed inset-x-0 top-0 z-10 border-b border-gray-950/5 dark:border-white/10">
        <div className="basis-full flex justify-center items-center w-full ">
            <div className="flex w-full px-2 gap-4">
                <Link
                    href="/"
                    aria-label="Home"
                    title="Home"
                    className="text-gray-600 transition-colors hover:text-blue-600 mr-auto"
                >
                    <HomeIcon />
                </Link>
                <h1 className="text-center text-lg font-bold text-blue-600 flex-1">
                    Lions Score Tracker</h1>
            </div>
        </div>
        <div className="basis-full flex justify-center items-center w-full">
            {auth && <AuthStatus />}
        </div>

    </header>