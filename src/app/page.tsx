import { auth } from "@/lib/auth";
import { getDefaultDashboardRoute, getSessionRole } from "@/lib/authorization";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login?from=/");
  }

  redirect(getDefaultDashboardRoute(getSessionRole(session)));
}
