/**
 * Proxy API Route: Sign Out
 *
 * Server-side proxy for signing out users.
 * Clears the session from the database and removes the HttpOnly cookie.
 *
 * Network Security:
 * - No credentials sent (just the session cookie, which is automatically included)
 * - Session cookie is cleared server-side
 * - Response includes Set-Cookie header to delete the cookie in browser
 *
 * Usage (from header/nav):
 *   fetch('/api/proxy/sign-out', {
 *     method: 'POST',
 *     credentials: 'include' // Include cookies in request
 *   })
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: Request) {
  try {
    // Verify user has active session before sign out
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return Response.json({ error: "No active session" }, { status: 401 });
    }

    // Sign out: clears session and sets cookie to expire
    await auth.api.signOut({
      headers: await headers(),
    });

    console.log(`User ${session.user.email} signed out`);

    return Response.json(
      {
        success: true,
        message: "Signed out successfully",
        redirect: "/login",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Sign out error:", error);
    return Response.json({ error: "Sign out failed" }, { status: 500 });
  }
}

// Only allow POST to this endpoint
export async function GET() {
  return Response.json(
    { error: "Method not allowed. Use POST." },
    { status: 405 },
  );
}

export async function PUT() {
  return Response.json(
    { error: "Method not allowed. Use POST." },
    { status: 405 },
  );
}

export async function DELETE() {
  return Response.json(
    { error: "Method not allowed. Use POST." },
    { status: 405 },
  );
}
