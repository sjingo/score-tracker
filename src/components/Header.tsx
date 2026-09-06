"use client";

import { HomeIcon } from "@/icons/home"
import { useSession, signOut } from "@/lib/auth-client";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserIcon } from "@/icons/user";
import { LogoutIcon } from "@/icons/logout";

{/* Header */ }
export const Header = () => {
    const { data: session } = useSession();




    return (
        <header className="bg-salts-blue  fixed inset-x-0 top-0 z-10 border-b border-gray-950/5 dark:border-white/10">
            <div className="flex items-center justify-between flex-wrap pt-2 max-w-[1200px] m-auto relative">
                {/* Logo and Navigation */}
                <div className="flex w-full px-2 gap-4">
                    <Link
                        href="/"
                        aria-label="Home"
                        title="Home"
                        className="text-gray-600 transition-colors hover:text-blue-600 mr-auto"
                    >
                        <HomeIcon className="size-6 stroke-amber-400 dark:stroke-white-500" />
                    </Link>
                    <h1 className=" text-lg font-bold text-amber-400 flex-1">
                        Lions Score Tracker</h1>
                </div>
                {/* User Info */}
                <div className="flex px-2 gap-4 w-full min-h-[32px]">
                    {
                        session ?
                            <>
                                <Link
                                    href="/account"
                                    aria-label="My account"
                                    title="My account"
                                    className="text-gray-600 transition-colors hover:text-blue-600"
                                >
                                    <UserIcon className="size-6 stroke-amber-400 dark:stroke-white-500" />
                                </Link>
                                <span className="text-sm text-amber-400">
                                    {session && session.user.email}
                                </span>

                            </> : null
                    }
                </div>
                <button
                    onClick={async () => {
                        await signOut();
                        // window.location.href = "/";
                        redirect("/login");
                    }}
                    className="cursor-pointer absolute right-0 text-md bg-amber-400 text-sky-600 text-bold hover:bg-amber-400 transition-colors p-2 h-full top-0"
                >
                    <LogoutIcon className="size-6 stroke-sky-600 dark:stroke-white-500 " />
                </button>
            </div>
        </header >
    );
}