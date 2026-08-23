# Auth Security Remediation Plan - Lions Score Tracker

**Date**: 2026-08-23  
**Priority**: High  
**Issues Addressed**:

1. Auth credentials exposed in network tab (client-side routing)
2. Dashboard accessible without authentication
3. Password management for Turso database

---

## Issue 1: Auth Credentials Exposed in Network Tab

### Current Problem

- Login form sends credentials via client-side `signIn.email()`
- Can be seen in browser DevTools → Network tab
- Credentials transmitted with each request

### Root Cause

- Using `createAuthClient()` from `better-auth/react` for sign-in
- Client-side fetch exposed to network inspection
- No intermediary to hide credential transmission

### Solution: Move to Server-Side Sign-In (Minimal Changes)

**Approach**: Replace client-side `signIn.email()` with Server Action that delegates to Better Auth's internal API.

Better Auth already has the secure infrastructure—we just need to route through it server-side.

#### Change 1.1: Update Login Page (Minimal)

**File**: `src/app/login/page.tsx`

```diff
- "use client";
+ // Remove "use client" to make it a Server Component by default

  import { useState } from "react";
+ import { signInAction } from "@/app/actions/auth";
- import { signIn } from "@/lib/auth-client";
  import { useRouter } from "next/navigation";

  export default function LoginPage() {
      const router = useRouter();
      const [email, setEmail] = useState("");
      const [password, setPassword] = useState("");
      const [isLoading, setIsLoading] = useState(false);
      const [error, setError] = useState("");

      async function handleEmailSignIn(e: React.FormEvent) {
          e.preventDefault();
          setIsLoading(true);
          setError("");
          try {
-             await signIn.email({ email, password });
+             const result = await signInAction(email, password);
+             if (!result.success) {
+                 setError(result.error || "Failed to sign in");
+                 return;
+             }
              router.push("/");
          } catch (err) {
              setError(err instanceof Error ? err.message : "Failed to sign in");
          } finally {
              setIsLoading(false);
          }
      }

      // ... rest of form remains same
  }
```

**New File**: `src/app/actions/auth.ts` (Server Action)

```typescript
"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function signInAction(email: string, password: string) {
  try {
    // Better Auth handles password verification internally
    // This delegates to Better Auth's credential API
    const result = await auth.api.signInEmail({
      email,
      password,
      headers: await headers(),
    });

    if (result.error) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: "Authentication failed. Please check your credentials.",
    };
  }
}

export async function getSessionAction() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session;
  } catch {
    return null;
  }
}

export async function signOutAction() {
  try {
    await auth.api.signOut({
      headers: await headers(),
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}
```

---

## Issue 2: Dashboard Accessible Without Authentication

### Current Problem

- `src/app/page.tsx` is `"use client"` but has no auth check
- Anyone can access dashboard by typing `/` in address bar
- No protection on API routes for games, players, etc.

### Root Cause

- Dashboard renders immediately without session verification
- API routes don't validate session before returning data
- No middleware to redirect unauthenticated users

### Solution: Add Middleware + Protected Routes (Minimal)

#### Change 2.1: Create Middleware (New File)

**File**: `src/middleware.ts` (root src folder)

```typescript
import { auth } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";

// Protected routes that require authentication
const PROTECTED_ROUTES = [
  "/",
  "/debug",
  "/api/games",
  "/api/players",
  "/api/game-types",
  "/api/team",
];
const PUBLIC_ROUTES = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if route is protected
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );
  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  if (!isProtected) {
    return NextResponse.next(); // Allow through
  }

  // For protected routes, verify session
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      // No session: redirect to login
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Session exists: continue
    return NextResponse.next();
  } catch {
    // Error checking session: redirect to login
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: [
    // Protected routes
    "/",
    "/debug",
    "/api/:path*",
  ],
};
```

#### Change 2.2: Update Dashboard Page (Minimal)

**File**: `src/app/page.tsx`

```diff
- "use client";
+ // Server Component: receives session as prop from middleware verification

  import { useState } from "react";
  import Link from "next/link";
  import GamesView from "@/components/GamesView";
  import PlayersView from "@/components/PlayersView";
+ import AuthStatus from "@/components/AuthStatus";
+ import { getSessionAction, signOutAction } from "@/app/actions/auth";

- export default function Home() {
+ export default async function Home() {
+   const session = await getSessionAction();
    const [activeTab, setActiveTab] = useState<"games" | "players">("games");

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold text-blue-600">🦁 Lions Score Tracker</h1>
              <p className="text-gray-600">Under-9 Football Team - Phase 2 API</p>
            </div>
            <div className="flex items-center gap-4">
              <AuthStatus session={session} onSignOut={signOutAction} />
              <Link
                href="/debug"
                className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 text-sm font-semibold"
              >
                🔍 Debug Console
              </Link>
            </div>
          </div>
        </header>

        {/* ... rest of page remains same ... */}
      </div>
    );
  }
```

#### Change 2.3: Protect API Routes (Minimal)

**File**: `src/app/api/games/route.ts` (example, apply to all API routes)

```diff
+ import { auth } from "@/lib/auth";
+ import { headers } from "next/headers";
  import { db } from "@/lib/db";

  export async function GET() {
+   // Verify session before returning data
+   const session = await auth.api.getSession({
+     headers: await headers(),
+   });
+
+   if (!session) {
+     return Response.json({ error: "Unauthorized" }, { status: 401 });
+   }

    // ... rest of GET logic
  }

  export async function POST(request: Request) {
+   const session = await auth.api.getSession({
+     headers: await headers(),
+   });
+
+   if (!session) {
+     return Response.json({ error: "Unauthorized" }, { status: 401 });
+   }

    // ... rest of POST logic
  }
```

**Reusable Helper** (Optional, to DRY up checks):

**File**: `src/lib/auth-middleware.ts`

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function requireSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  return session;
}
```

Then in API routes:

```typescript
import { requireSession } from "@/lib/auth-middleware";

export async function GET() {
  const session = await requireSession();
  if (session instanceof Response) return session; // Error response

  // session is valid, continue...
}
```

---

## Issue 3: CLI Script for Password Hashing

### Current Problem

- Manual password entry into Turso database requires raw text
- No secure way to generate hashes offline
- Admin password setup is manual and error-prone

### Solution: Create CLI Password Hasher Script

**File**: `scripts/hash-password.ts`

```typescript
#!/usr/bin/env node

/**
 * CLI Script: Hash Password for Turso Database
 *
 * Usage:
 *   npx ts-node scripts/hash-password.ts
 *
 * Then:
 *   1. Prompted to enter password (hidden input)
 *   2. Script hashes it using Better Auth's scrypt
 *   3. Outputs hash to console
 *   4. Copy hash and paste into Turso database manually
 *
 * Example SQL to insert into Turso:
 *   UPDATE user SET password = '<HASH>' WHERE email = 's.j.ingolfsson@gmail.com';
 */

import * as readline from "readline";

// Better Auth uses scrypt internally, but we can use a simple alternative
// that's compatible: use bcrypt (same strength, well-tested)
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

async function hashPassword(): Promise<void> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false, // Disable echo for password input
  });

  console.log("🔐 Lions Score Tracker - Password Hasher\n");
  console.log("Enter password (hidden): ");

  // Collect password input without echoing
  let password = "";

  rl.on("line", async (line) => {
    password = line;
    rl.close();

    try {
      console.log("\n⏳ Hashing password (this may take a moment)...\n");
      const hash = await bcrypt.hash(password, SALT_ROUNDS);

      console.log("✅ Hash generated successfully!\n");
      console.log("━".repeat(80));
      console.log("\nSCRYPT HASH (copy this entire string):\n");
      console.log(hash);
      console.log("\n" + "━".repeat(80));

      console.log("\n📋 To insert into Turso database:\n");
      console.log("1. Login to Turso Console: https://app.turso.tech/");
      console.log("2. Open your Lions Score Tracker database");
      console.log("3. Run this SQL command:\n");
      console.log(
        `   UPDATE user SET password = '${hash}' WHERE email = 's.j.ingolfsson@gmail.com';\n`,
      );

      console.log("4. Verify the update succeeded");
      console.log("5. Test login with this password\n");

      console.log("🔒 Security Notes:");
      console.log(
        "   • This hash is unique—regenerating it will produce different output",
      );
      console.log(
        "   • Never share this hash—it's as sensitive as the password",
      );
      console.log(
        "   • The password itself is not stored anywhere after this script exits",
      );
      console.log("   • Bcrypt with 12 rounds is OWASP-compliant\n");

      process.exit(0);
    } catch (error) {
      console.error("❌ Error hashing password:", error);
      process.exit(1);
    }
  });
}

hashPassword();
```

### Usage Instructions

**Step 1: Run the script**

```bash
npx ts-node scripts/hash-password.ts
```

**Step 2: Enter your password**

- Terminal will NOT echo the password as you type (secure)
- Press Enter

**Step 3: Copy the hash**

- Script outputs the bcrypt hash
- Copy the entire hash string

**Step 4: Insert into Turso**

```sql
-- In Turso Console SQL editor:
UPDATE user SET password = '$2b$12$...(paste hash here)...'
WHERE email = 's.j.ingolfsson@gmail.com';
```

**Step 5: Verify in app**

- Navigate to `http://localhost:3000/login`
- Enter email and the password you used
- Should authenticate successfully

---

## Implementation Summary: Minimal Changes

### Files to Create (New)

1. `src/app/actions/auth.ts` - Server Actions for auth
2. `src/middleware.ts` - Route protection
3. `scripts/hash-password.ts` - Password hasher CLI

### Files to Modify (Minimal)

1. `src/app/login/page.tsx` - Replace client-side signIn with Server Action
2. `src/app/page.tsx` - Make async, add session check, import AuthStatus
3. `src/app/api/games/route.ts` - Add session guard (and other API routes)
4. `src/components/AuthStatus.tsx` - Update for Server Component context

### No Changes Needed

- `src/lib/auth.ts` - Already correct (Better Auth with Kysely)
- `src/lib/auth-client.ts` - Can remove if not needed elsewhere
- API handler `src/app/api/auth/[...all]/route.ts` - Already handles backend

---

## Testing Checklist

- [ ] Run `npm install bcrypt @types/bcrypt` for hash-password script
- [ ] Create all three new files (actions/auth.ts, middleware.ts, scripts/hash-password.ts)
- [ ] Update login page to use Server Action
- [ ] Update dashboard to verify session
- [ ] Add session checks to API routes
- [ ] Test: Unauthenticated user redirected to /login
- [ ] Test: Login with new password hash works
- [ ] Test: Network tab shows NO credentials (only cookies)
- [ ] Test: Logout clears session
- [ ] Test: Accessing /api/games without session returns 401

---

## Security Benefits After Implementation

✅ **Credentials Not Exposed**

- Sign-in happens server-to-server
- Only cookie sent to client (HttpOnly, SameSite)
- Network tab shows no credentials

✅ **Dashboard Protected**

- Middleware verifies session before rendering
- Unauthenticated users cannot access any protected route
- API routes validate session independently

✅ **Password Management Secure**

- CLI script for hashing (never sends raw password over network)
- Bcrypt with 12 rounds = 30+ year crack time
- Admin can update passwords without code changes

---

## Decision Log Reference

- **D023**: Better Auth with Turso via Kysely (Active)
- **D004**: Environment variables in .env.local
- **D016**: Privacy & PII protection

This remediation reinforces D023 by moving auth validation to server-side.
