import GamesPage from "@/components/GamesPage";
import { getGames } from "@/lib/games";
import { requireDashboardPage } from "@/lib/authorization";

export default async function GamesRoute() {
    const { role } = await requireDashboardPage("games");
    const initialGames = await getGames();

    return <GamesPage initialGames={initialGames} role={role} />;
}