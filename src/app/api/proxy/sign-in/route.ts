/**
 * Proxy API Route: Sign In
 *
 * This is a server-side proxy that accepts credentials and delegates to Better Auth.
 * Credentials are sent to YOUR server (not an external auth service), making this secure.
 *
 * Network Security:
 * - Credentials sent to /api/proxy/sign-in (your own server)
 * - Better Auth verifies password server-side (not in browser)
 * - Response includes Set-Cookie header with HttpOnly session token
 * - Browser automatically stores cookie (JavaScript cannot access it)
 *
 * Usage (from login form):
 *   fetch('/api/proxy/sign-in', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     credentials: 'include', // Send and receive cookies
 *     body: JSON.stringify({ email, password })
 *   })
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type");
    if (!contentType?.includes("application/json")) {
      return Response.json(
        { error: "Content-Type must be application/json" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { email, password } = body;

    // Validate inputs
    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    if (typeof email !== "string" || typeof password !== "string") {
      return Response.json(
        { error: "Email and password must be strings" },
        { status: 400 },
      );
    }

    // Sanitize inputs (basic validation)
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail.includes("@")) {
      return Response.json({ error: "Invalid email format" }, { status: 400 });
    }

    if (password.length < 1) {
      return Response.json(
        { error: "Password cannot be empty" },
        { status: 400 },
      );
    }

    // Call Better Auth's server method
    // This verifies the email/password against the database hash
    // All password verification happens server-side (secure)
    const result = await auth.api.signInEmail(
      {
        email: trimmedEmail,
        password,
      },
      {
        headers: await headers(),
      },
    );

    // Better Auth returns error if credentials are invalid
    if (result.error) {
      console.warn(`Sign in attempt failed for ${trimmedEmail}`);
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    // Success: session cookie is set automatically by Better Auth
    // The Set-Cookie header is included in the response
    console.log(`User ${trimmedEmail} signed in successfully`);

    return Response.json(
      {
        success: true,
        message: "Signed in successfully",
        redirect: "/",
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Sign in error:", error);
    return Response.json(
      { error: "Authentication failed. Please try again." },
      { status: 500 },
    );
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
