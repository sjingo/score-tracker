"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type MouseEvent, type ReactNode } from "react";
import { DASHBOARD_ROUTES, type DashboardTab } from "@/lib/dashboard";
import type { AuthRole } from "@/lib/auth";
import PageContainer from "@/components/PageContainer";

const ADMIN_TABS: Array<[DashboardTab, string]> = [
    ["games", "⚽ Games"],
    ["matches", "📊 Matches"],
    ["stats", "📈 Stats"],
    ["players", "👥 Squad"],
];

const USER_TABS: Array<[DashboardTab, string]> = [
    ["matches", "📊 Matches"],
    ["stats", "📈 Stats"],
];

interface DashboardShellProps {
    activeTab: DashboardTab;
    role: AuthRole;
    children: ReactNode;
    hasInProgressGame?: boolean;
}

export default function DashboardShell({
    activeTab,
    role,
    children,
    hasInProgressGame = false,
}: DashboardShellProps) {
    const router = useRouter();
    const [pendingTab, setPendingTab] = useState<DashboardTab | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const tabs = role === "admin" ? ADMIN_TABS : USER_TABS;

    const handleTabChange = useCallback((event: MouseEvent<HTMLAnchorElement>, tab: DashboardTab) => {
        if (activeTab === "games" && hasInProgressGame && tab !== "games") {
            event.preventDefault();
            setPendingTab(tab);
            setShowConfirm(true);
        }
    }, [activeTab, hasInProgressGame]);

    const handleConfirmNavigation = () => {
        if (pendingTab) {
            router.push(DASHBOARD_ROUTES[pendingTab]);
        }
        setShowConfirm(false);
        setPendingTab(null);
    };

    useEffect(() => {
        if (activeTab === "games" && hasInProgressGame) {
            const handleBeforeUnload = (event: BeforeUnloadEvent) => {
                event.preventDefault();
                event.returnValue = "You have a game in progress. Are you sure you want to leave?";
            };
            window.addEventListener("beforeunload", handleBeforeUnload);
            return () => window.removeEventListener("beforeunload", handleBeforeUnload);
        }
    }, [activeTab, hasInProgressGame]);

    return (
        <div className="flex min-h-[calc(100dvh-80px)] flex-1 flex-col bg-gradient-to-br from-blue-50 to-indigo-100">
            <nav className="border-b bg-white" aria-label="Dashboard navigation">
                <PageContainer flush>
                    <div className="flex min-w-0 gap-4 overflow-x-auto">
                        {tabs.map(([tab, label]) => (
                            <Link
                                key={tab}
                                href={DASHBOARD_ROUTES[tab]}
                                onClick={(event) => handleTabChange(event, tab)}
                                aria-current={activeTab === tab ? "page" : undefined}
                                className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-semibold transition sm:px-4 sm:py-3 sm:text-base ${activeTab === tab
                                    ? "border-salts-blue text-blue-600"
                                    : "border-transparent text-gray-600 hover:text-gray-900"
                                    }`}
                            >
                                {label}
                            </Link>
                        ))}
                    </div>
                </PageContainer>
            </nav>

            <div className="flex-1">{children}</div>

            {showConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="mx-3 w-full max-w-sm rounded-lg bg-white p-4 shadow-lg sm:mx-4 sm:p-6">
                        <h2 className="mb-3 text-lg font-semibold text-gray-900">Game in Progress</h2>
                        <p className="mb-6 text-sm text-gray-600 sm:text-base">
                            You have a game in progress. Navigating away may lose unsaved data. Are you sure you want to continue?
                        </p>
                        <div className="flex flex-wrap justify-end gap-2 sm:gap-3">
                            <button
                                onClick={() => {
                                    setShowConfirm(false);
                                    setPendingTab(null);
                                }}
                                className="rounded border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50 sm:px-4 sm:py-2"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmNavigation}
                                className="rounded bg-red-600 px-3 py-1.5 font-medium text-white hover:bg-red-700 sm:px-4 sm:py-2"
                            >
                                Leave Game
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <footer className="mt-12 bg-gray-800 py-6 text-gray-300" />
        </div>
    );
}