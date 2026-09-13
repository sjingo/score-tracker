import DashboardShell from "@/components/DashboardShell";
import StatsView from "@/components/StatsView";
import { requireDashboardPage } from "@/lib/authorization";

export default async function StatsRoute() {
    const { role } = await requireDashboardPage("stats");

    return (
        <DashboardShell activeTab="stats" role={role}>
            <StatsView />
        </DashboardShell>
    );
}