import { auth, type AuthRole } from "@/lib/auth";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DASHBOARD_ROUTES, type DashboardTab } from "@/lib/dashboard";

type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

const DASHBOARD_PERMISSIONS: Record<DashboardTab, AuthRole[]> = {
  games: ["admin"],
  matches: ["admin", "user"],
  stats: ["admin", "user"],
  players: ["admin"],
};

export function getSessionRole(session: Session): AuthRole {
  return (session.user as typeof session.user & { role: AuthRole }).role;
}

export function canAccessDashboardTab(role: AuthRole, tab: DashboardTab) {
  return DASHBOARD_PERMISSIONS[tab].includes(role);
}

export function getDefaultDashboardRoute(role: AuthRole) {
  return role === "admin" ? DASHBOARD_ROUTES.games : DASHBOARD_ROUTES.matches;
}

export async function requireDashboardPage(tab: DashboardTab) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect(`/login?from=${DASHBOARD_ROUTES[tab]}`);
  }

  const role = getSessionRole(session);
  if (!canAccessDashboardTab(role, tab)) {
    redirect(getDefaultDashboardRoute(role));
  }

  return { role };
}

export async function requireAuthenticated(
  request: Request,
): Promise<Session | NextResponse> {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  return session;
}

export async function requireRole(
  request: Request,
  role: AuthRole,
): Promise<Session | NextResponse> {
  const session = await requireAuthenticated(request);
  if (session instanceof Response) return session;

  if (getSessionRole(session) !== role) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 },
    );
  }

  return session;
}
