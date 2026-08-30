# Auth Security Implementation Checklist

**Status**: Ready to Implement  
**Last Updated**: 2026-08-23  
**Priority**: High (Security)

---

## ✅ Files Created (Ready to Use)

These files have been created and are ready:

1. **`src/app/actions/auth.ts`** ✅
   - Server Actions for secure auth handling
   - Functions: `signInAction()`, `getSessionAction()`, `signOutAction()`, `getUserAction()`
   - Usage: Import and call from client components

2. **`src/middleware.ts`** ✅
   - Route protection middleware
   - Redirects unauthenticated users to /login
   - Protects: /, /debug, /api/\*

3. **`scripts/hash-password.ts`** ✅
   - CLI tool for password hashing
   - Usage: `npx ts-node scripts/hash-password.ts`
   - Creates bcrypt hash for Turso manual insert

4. **`AUTH_SECURITY_REMEDIATION.md`** ✅
   - Full documentation of all three security issues
   - Detailed before/after code examples
   - Testing checklist

---

## 📋 Implementation Steps

### Step 1: Install Required Dependency

```bash
npm install bcrypt
npm install -D @types/bcrypt
```

**Why**: Script uses bcrypt for password hashing (same security as scrypt, well-tested).

---

### Step 2: Update Login Page

**File**: `src/app/login/page.tsx`

Replace the entire file with this:

```typescript
"use client";

import { useState } from "react";
import { signInAction } from "@/app/actions/auth";
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
      const result = await signInAction(email, password);
      if (!result.success) {
        setError(result.error || "Failed to sign in");
        return;
      }
      // Clear form and redirect
      setEmail("");
      setPassword("");
      router.push("/");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to sign in. Please check your credentials."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-900">
          🦁 Lions Score Tracker
        </h1>
        <p className="text-center text-gray-600 mb-8">Sign in to your account</p>

        {error && (
          <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-gray-500 text-xs mt-6">
          Admin-only login. Credentials managed by team.
        </p>
      </div>
    </div>
  );
}
```

---

### Step 3: Update Dashboard Page

**File**: `src/app/page.tsx`

Replace with this (key changes: add `async`, session check, AuthStatus import):

```typescript
import { useState } from "react";
import Link from "next/link";
import GamesView from "@/components/GamesView";
import PlayersView from "@/components/PlayersView";
import AuthStatus from "@/components/AuthStatus";
import { getSessionAction, signOutAction } from "@/app/actions/auth";

export default async function Home() {
  const session = await getSessionAction();

  if (!session) {
    // This should not happen due to middleware, but as a safety fallback
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Redirecting to login...</h1>
          <p className="text-gray-600">If not redirected, please clear browser cache.</p>
        </div>
      </div>
    );
  }

  return (
    <DashboardContent session={session} />
  );
}

/**
 * Client component for tab state (needs useState)
 */
"use client";

import { useState } from "react";

function DashboardContent({ session }: any) {
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
            <AuthStatus session={session} />
            <Link
              href="/debug"
              className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 text-sm font-semibold"
            >
              🔍 Debug Console
            </Link>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("games")}
              className={`px-4 py-3 font-semibold border-b-2 transition ${
                activeTab === "games"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              ⚽ Games
            </button>
            <button
              onClick={() => setActiveTab("players")}
              className={`px-4 py-3 font-semibold border-b-2 transition ${
                activeTab === "players"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              👥 Squad
            </button>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border-b-2 border-blue-200">
        <div className="max-w-6xl mx-auto px-4 py-3 text-sm text-blue-800">
          <p>
            <strong>Phase 2 Features:</strong> Full Games CRUD, Score Tracking with Auto-Increment,
            Player Validation, Comprehensive Logging (check browser console F12), Debug Tables
            Viewer
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="py-6">
        {activeTab === "games" && <GamesView />}
        {activeTab === "players" && <PlayersView />}
      </main>

      {/* Footer Info */}
      <footer className="bg-gray-800 text-gray-300 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm">
          <p>🔧 Console Logging Enabled | Open Developer Tools (F12) to see detailed API logs</p>
          <p className="mt-2">
            <Link href="/debug" className="text-blue-400 hover:text-blue-300">
              View Debug Console
            </Link>
            {" "} for full database table viewer
          </p>
        </div>
      </footer>
    </div>
  );
}
```

---

### Step 4: Add Session Guard to API Routes

**File**: `src/app/api/games/route.ts` (and apply to: games/[gameId], games/[gameId]/scores, players, game-types, team)

Add this at the top of each GET/POST handler:

```typescript
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  // Verify session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ... rest of GET logic
}

export async function POST(request: Request) {
  // Verify session
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ... rest of POST logic
}
```

---

### Step 5: Generate Admin Password Hash

Once all files are in place, run the password hashing script:

```bash
npx ts-node scripts/hash-password.ts
```

**What happens**:

1. Prompted to enter password (terminal won't show input)
2. Script outputs bcrypt hash
3. Copy the hash

**Insert into Turso**:

```sql
UPDATE user SET password = '<PASTE_HASH_HERE>'
WHERE email = 's.j.ingolfsson@gmail.com';
```

---

### Step 6: Test Everything

```bash
npm run dev
```

**Test Sequence**:

1. ✅ **Test unauthenticated access**
   - Try: `http://localhost:3000` (should redirect to /login)
   - Try: `http://localhost:3000/debug` (should redirect to /login)

2. ✅ **Test login page**
   - Navigate to `http://localhost:3000/login`
   - Enter email: `s.j.ingolfsson@gmail.com`
   - Enter your password (the one you hashed)
   - Should redirect to dashboard

3. ✅ **Test network tab** (IMPORTANT)
   - Open DevTools → Network tab
   - Clear it
   - Try login
   - Look at requests:
     - Should see: fetch to `/api/auth/sign-in/email` (server action)
     - Should NOT see: raw email/password in request body
     - Should see: Set-Cookie header with `better-auth.session-token`
     - Subsequent requests should only have Cookie header

4. ✅ **Test dashboard access**
   - After login, should see full dashboard
   - Games and Players views should load

5. ✅ **Test API routes**
   - Open DevTools → Network tab
   - Refresh dashboard (should load data)
   - In Console, try: `fetch('/api/games')`
   - Should return 401 (no credentials in request, session via cookie only)

6. ✅ **Test logout**
   - Click logout button in header
   - Should redirect to /login
   - Try accessing / directly (should redirect to /login)

---

## 🔍 Verification: Credentials Not Exposed

### Before (BAD):

```
Network Tab → Request to /api/auth/sign-in/email

Headers:
  Authorization: Bearer eyJ...

Body:
  {
    "email": "s.j.ingolfsson@gmail.com",
    "password": "MyPassword123"  ← EXPOSED!
  }
```

### After (GOOD):

```
Network Tab → Request is Server Action (invisible to network tab)

Only visible: internal request
  No credentials shown

Response: Sets cookie
  Set-Cookie: better-auth.session-token=...; HttpOnly; SameSite=Lax

Subsequent requests: Only cookie
  Cookie: better-auth.session-token=...
```

---

## ⚠️ Known Issues to Fix

1. **AuthStatus component** might need update for Server Action context
   - Check if it's using `useSession()` hook
   - May need to accept session as prop instead

2. **API routes** (all of them) need session guard added
   - Currently unprotected
   - Apply same pattern: `auth.api.getSession()` check

3. **Signup page** exists but sign-up is disabled in Better Auth config
   - OK to leave as-is (secure)
   - Or delete `src/app/signup/page.tsx` if not used

---

## 📊 Summary of Changes

| Issue                        | Solution                    | Files Changed         | Security Gain             |
| ---------------------------- | --------------------------- | --------------------- | ------------------------- |
| Credentials in network tab   | Server Actions + Middleware | login, middleware.ts  | Credentials never exposed |
| Dashboard unprotected        | Middleware + Route checks   | middleware.ts, page   | Auth required for access  |
| Password management insecure | CLI hashing script          | scripts/hash-password | Secure hash generation    |

---

## 🚀 After Implementation

Your auth system will have:

✅ **Server-side credential handling** - No credentials exposed in network tab  
✅ **Protected routes** - Unauthenticated users auto-redirected to login  
✅ **Protected API** - All endpoints validate session server-side  
✅ **Secure password management** - CLI tool for admin password updates  
✅ **Better Auth integration** - Leverages battle-tested auth framework  
✅ **Cookie-based sessions** - HttpOnly, SameSite cookies (secure by default)

---

## 📝 Next Steps

1. Run `npm install bcrypt @types/bcrypt`
2. Update files per steps 2-4 above
3. Run password hashing script
4. Test all verification steps
5. Commit changes to git
6. Deploy with confidence!

---

## Questions?

Refer to:

- `AUTH_SECURITY_REMEDIATION.md` - Detailed technical explanation
- `AUTH_SETUP_GUIDE.md` - Better Auth overview
- `AUTH_COMPLETE_SETUP.md` - Full architecture
