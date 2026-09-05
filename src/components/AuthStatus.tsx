"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserIcon } from "@/icons/user";

export function AuthStatus() {
    const { data: session } = useSession();


    if (!session || !session.user) {
        return (
            null
        );
    }

    return (
        <div className="flex w-full justify-between  gap-4 px-2 pb-2">
            <Link
                href="/account"
                aria-label="My account"
                title="My account"
                className="text-gray-600 transition-colors hover:text-blue-600"
            >
                <UserIcon />
            </Link>
            <span className="text-sm text-gray-600">
                {session && session.user.email}
            </span>
            <button
                onClick={async () => {
                    await signOut();
                    // window.location.href = "/";
                    redirect("/login");
                }}
                className="px-2 py-1 text-xs bg-red-300 text-white rounded hover:bg-red-500 transition-colors"
            >
                Sign Out
            </button>
        </div>
    );
}
