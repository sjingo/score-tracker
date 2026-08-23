"use server";

/**
 * Server Actions for Authentication
 *
 * These functions run on the server and are called from client components.
 * They provide secure server-side handling of auth operations without exposing
 * credentials in network tab.
 *
 * Usage in client components:
 *   import { signInAction, getSessionAction, signOutAction } from "@/app/actions/auth";
 *
 *   const result = await signInAction(email, password);
 *   const session = await getSessionAction();
 *   await signOutAction();
 */

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Server-side sign in with email and password
 * Credentials are sent to this server action, not exposed to client
 * Better Auth handles password verification internally using scrypt
 */
export async function signInAction(
  email: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!email || !password) {
      return { success: false, error: "Email and password are required" };
    }

    // Better Auth's signInEmail API validates password against database hash
    // Password verification happens server-side only
    const result = await auth.api.signInEmail(
      {
        email,
        password,
      },
      {
        headers: await headers(),
      },
    );

    // Check for Better Auth errors
    if (result.error) {
      return {
        success: false,
        error: "Invalid email or password",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Sign in error:", error);
    return {
      success: false,
      error: "Authentication failed. Please try again.",
    };
  }
}

/**
 * Get current user session
 * Returns session data or null if not authenticated
 */
export async function getSessionAction() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    return session;
  } catch (error) {
    // Session validation failed or doesn't exist
    return null;
  }
}

/**
 * Sign out current user
 * Clears session cookie and destroys session
 */
export async function signOutAction(): Promise<{ success: boolean }> {
  try {
    await auth.api.signOut({
      headers: await headers(),
    });

    return { success: true };
  } catch (error) {
    console.error("Sign out error:", error);
    return { success: false };
  }
}

/**
 * Get user profile (requires active session)
 * Use this to check current user's email, role, etc.
 */
export async function getUserAction() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session) {
      return null;
    }

    return session.user;
  } catch {
    return null;
  }
}
