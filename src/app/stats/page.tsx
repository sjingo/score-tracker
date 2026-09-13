import DashboardShell from "@/components/DashboardShell";
import StatsView from "@/components/StatsView";
import { requireDashboardPage } from "@/lib/authorization";
import { getGames } from "@/lib/games";

export default async function StatsRoute() {
    const { role } = await requireDashboardPage("stats");
    const initialGames = await getGames();

    return (
        <DashboardShell activeTab="stats" role={role}>
            <StatsView initialGames={initialGames} />
        </DashboardShell>
    );
}