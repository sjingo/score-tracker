import { Suspense } from "react";
import DashboardShell from "@/components/DashboardShell";
import MatchesView from "@/components/MatchesView";
import { requireDashboardPage } from "@/lib/authorization";

export default async function MatchesRoute() {
    const { role } = await requireDashboardPage("matches");

    return (
        <DashboardShell activeTab="matches" role={role}>
            <Suspense fallback={
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="text-center text-gray-500">Loading matches...</div>
                </div>
            }>
                <MatchesView />
            </Suspense>
        </DashboardShell>
    );
}