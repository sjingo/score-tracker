import { Suspense } from "react";
import DashboardShell from "@/components/DashboardShell";
import LoadingSpinner from "@/components/LoadingSpinner";
import MatchesView from "@/components/MatchesView";
import { requireDashboardPage } from "@/lib/authorization";

export default async function MatchesRoute() {
    const { role } = await requireDashboardPage("matches");

    return (
        <DashboardShell activeTab="matches" role={role}>
            <Suspense fallback={<LoadingSpinner label="Loading matches..." className="mx-auto max-w-6xl" />}>
                <MatchesView />
            </Suspense>
        </DashboardShell>
    );
}