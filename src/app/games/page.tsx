import GamesPage from "@/components/GamesPage";
import { requireDashboardPage } from "@/lib/authorization";

export default async function GamesRoute() {
    const { role } = await requireDashboardPage("games");

    return <GamesPage role={role} />;
}