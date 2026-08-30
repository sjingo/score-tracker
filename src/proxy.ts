/**
 * Middleware: Route Protection & Authentication
 *
 * This middleware intercepts all requests and:
 * 1. Checks if the requested route requires authentication
 * 2. Verifies the user's session via Better Auth
 * 3. Redirects to login if session is invalid
 *
 * Routes are categorized as:
 * - PROTECTED: Require valid session (/, /debug, /api/*)
 * - PUBLIC: Accessible without auth (/login)
 * - IGNORED: Pass through without checking (/_next, /static, etc)
 */

import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

/**
 * Routes that require authentication
 * Unauthenticated users will be redirected to /login
 */
const PROTECTED_ROUTES = ["/", "/debug", "/api/"];

/**
 * Public routes that don't need authentication
 * Users can access these without logging in
 */
const PUBLIC_ROUTES = ["/login", "/signup"];

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip proxy for static assets, Next.js internals, etc.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/public") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|css|js)$/)
  ) {
    return NextResponse.next();
  }

  // Check if route is public (no auth required)
  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  if (isPublic) {
    return NextResponse.next();
  }

  // Check if route requires authentication
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  if (!isProtected) {
    // Route is neither protected nor public, allow through
    return NextResponse.next();
  }

  // Protected route: verify session
  try {
    // Attempt to get session using Better Auth
    // Better Auth validates session from the request headers/cookies
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session || !session.user) {
      // No valid session: redirect to login
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("from", pathname); // Optional: where to redirect after login
      return NextResponse.redirect(loginUrl);
    }

    // Session is valid: allow request to proceed
    // Optionally, attach user info to request (via custom headers if needed)
    const response = NextResponse.next();
    // Could add custom headers here if needed:
    // response.headers.set("x-user-id", session.user.id);
    return response;
  } catch (error) {
    // Error during session validation (likely no session)
    console.error("Session validation error:", error);

    // Redirect to login
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

/**
 * Matcher: Which routes should run through this middleware
 *
 * This regex matches:
 * - Root: /
 * - App routes: /debug, /games, etc. (anything not starting with special chars)
 * - API routes: /api/...
 *
 * Excludes: /_next (Next.js), /static, etc (handled by code above)
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (Better Auth endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api/auth).*)",
  ],
};
