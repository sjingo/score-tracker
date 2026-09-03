"use client";

import { useSession, signOut } from "@/lib/auth-client";
import Link from "next/link";
import { Button } from "./Button";
import { redirect } from "next/navigation";

export function AuthStatus() {
    const { data: session } = useSession();


    if (!session || !session.user) {
        return (
            null
        );
    }

    return (
        <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
                Welcome, {session && session.user.email}
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
