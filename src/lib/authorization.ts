import { auth, type AuthRole } from "@/lib/auth";
import { NextResponse } from "next/server";

type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export function getSessionRole(session: Session): AuthRole {
  return (session.user as typeof session.user & { role: AuthRole }).role;
}

export async function requireRole(
  request: Request,
  role: AuthRole,
): Promise<Session | NextResponse> {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Authentication required" },
      { status: 401 },
    );
  }

  if (getSessionRole(session) !== role) {
    return NextResponse.json(
      { success: false, error: "Forbidden" },
      { status: 403 },
    );
  }

  return session;
}
