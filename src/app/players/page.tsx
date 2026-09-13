import DashboardShell from "@/components/DashboardShell";
import PlayersView from "@/components/PlayersView";
import { requireDashboardPage } from "@/lib/authorization";

export default async function PlayersRoute() {
    const { role } = await requireDashboardPage("players");

    return (
        <DashboardShell activeTab="players" role={role}>
            <PlayersView />
        </DashboardShell>
    );
}