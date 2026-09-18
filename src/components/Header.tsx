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
            <div className="relative mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between px-2 pt-2 sm:px-4">
                {/* Logo and Navigation */}
                <div className="flex w-full items-center gap-2 pr-10 sm:gap-4 sm:pr-12">
                    <Link
                        href="/"
                        aria-label="Home"
                        title="Home"
                        className="text-gray-600 transition-colors hover:text-blue-600 mr-auto"
                    >
                        <HomeIcon className="size-5 stroke-amber-200 dark:stroke-white-500 sm:size-6" />
                    </Link>
                    <h1 className="min-w-0 flex-1 truncate text-base font-bold text-amber-200 sm:text-lg">
                        Lions Score Tracker</h1>
                </div>
                {/* User Info */}
                <div className="flex min-h-[28px] w-full min-w-0 items-center gap-2 pr-10 sm:min-h-[32px] sm:gap-4 sm:pr-12">
                    {
                        session ?
                            <>
                                <Link
                                    href="/account"
                                    aria-label="My account"
                                    title="My account"
                                    className="text-gray-600 transition-colors hover:text-blue-600"
                                >
                                    <UserIcon className="size-5 stroke-amber-200 dark:stroke-white-500 sm:size-6" />
                                </Link>
                                <span className="truncate text-xs text-amber-200 sm:text-sm">
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
                    className="absolute right-0 top-0 h-full cursor-pointer bg-amber-200 p-2 text-sky-600 transition-colors hover:bg-amber-200 sm:px-3"
                >
                    <LogoutIcon className="size-5 stroke-sky-600 dark:stroke-white-500 sm:size-6" />
                </button>
            </div>
        </header >
    );
}