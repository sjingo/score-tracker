# Better Auth OAuth Setup Guide

This guide walks you through setting up Google and Facebook OAuth for Lions Score Tracker.

## Overview

Better Auth has been configured in your app with support for:

- ✅ Email/password authentication
- ✅ Google OAuth 2.0
- ✅ Facebook OAuth 2.0
- ✅ Session management via Turso database
- ✅ User authentication UI (login/signup pages)

## Files Created

### Core Authentication Files

| File                                 | Purpose                              |
| ------------------------------------ | ------------------------------------ |
| `src/lib/auth.ts`                    | Better Auth server configuration     |
| `src/lib/auth-client.ts`             | Client-side auth utilities for React |
| `src/app/api/auth/[...all]/route.ts` | Next.js API route handler            |
| `src/components/AuthStatus.tsx`      | Header component with login/logout   |
| `src/app/login/page.tsx`             | Login page (email + OAuth)           |
| `src/app/signup/page.tsx`            | Signup page (email + OAuth)          |

### Environment Setup

Updated `.env.local` with placeholders:

```env
BETTER_AUTH_SECRET=at9k7NOeQuLoBYLrTGGGx69CWp6uyKEhhARZJQjRMxA=
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

# OAuth credentials (NEED TO FILL IN)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
FACEBOOK_CLIENT_ID=your_facebook_app_id_here
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret_here
```

## Setup Steps

### Step 1: Run Database Migrations

Better Auth needs to create its user/session tables in Turso:

```bash
npm run dev
```

This will automatically create the necessary auth tables on first run. Better Auth uses its own schema separate from your Lions domain tables.

### Step 2: Get Google OAuth Credentials

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Create a new project (or select existing)
   - Enable the "Google+ API"

2. **Create OAuth 2.0 Client ID**
   - Go to: **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
   - Application type: **Web Application**
   - Add **Authorized redirect URIs**:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://yourdomain.com/api/auth/callback/google` (production)

3. **Copy credentials to `.env.local`**

   ```env
   GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
   ```

4. **Download JSON** (optional backup)
   - Click the download icon next to your client ID to save credentials

### Step 3: Get Facebook OAuth Credentials

1. **Go to Facebook Developers**
   - Visit: https://developers.facebook.com/apps
   - Click "Create App"

2. **Create App**
   - App name: "Lions Score Tracker" (or your choice)
   - App purpose: Select appropriate category
   - Create the app

3. **Add Facebook Login Product**
   - In your app dashboard, click **+ Add Product**
   - Find "Facebook Login" and click **Set Up**

4. **Configure OAuth Redirect URIs**
   - Go to **Settings** → **Basic**
   - Copy your **App ID** and **App Secret**
   - Go to **Facebook Login** → **Settings**
   - Add **Valid OAuth Redirect URIs**:
     - `http://localhost:3000/api/auth/callback/facebook` (development)
     - `https://yourdomain.com/api/auth/callback/facebook` (production)

5. **Copy credentials to `.env.local`**
   ```env
   FACEBOOK_CLIENT_ID=YOUR_APP_ID_HERE
   FACEBOOK_CLIENT_SECRET=YOUR_APP_SECRET_HERE
   ```

### Step 4: Verify Environment Variables

Make sure `.env.local` has all required fields filled in:

```bash
# Required - Don't change
BETTER_AUTH_SECRET=at9k7NOeQuLoBYLrTGGGx69CWp6uyKEhhARZJQjRMxA=
BETTER_AUTH_URL=http://localhost:3000

# Turso - Already configured
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...

# OAuth - Fill these in
GOOGLE_CLIENT_ID=abc123.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xyzabc...
FACEBOOK_CLIENT_ID=123456789
FACEBOOK_CLIENT_SECRET=abcdef...
```

### Step 5: Test the Authentication

1. **Start development server**

   ```bash
   npm run dev
   ```

2. **Visit login page**
   - Navigate to: http://localhost:3000/login

3. **Test email/password**
   - Sign up with email and password
   - Sign out
   - Sign back in

4. **Test OAuth (if credentials configured)**
   - Click "Google" button (if GOOGLE_CLIENT_ID is set)
   - Click "Facebook" button (if FACEBOOK_CLIENT_ID is set)
   - You should be redirected to provider, then back to app

### Step 6: Protect Routes (Next Steps)

Currently, all app routes are public. To require authentication:

```typescript
// Example: Protect the main dashboard
import { useSession } from "@/lib/auth-client";
import { redirect } from "next/navigation";

export default function DashboardPage() {
  const { data: session } = useSession();

  if (!session) {
    redirect("/login");
  }

  return (
    // Your dashboard content
  );
}
```

## Database Schema

Better Auth automatically creates these tables:

- `user` - User accounts (email, name, image, etc.)
- `session` - Active sessions (userId, sessionToken, expiresAt)
- `account` - OAuth provider links (userId, provider, providerAccountId)
- `verification_token` - Email verification tokens
- (Additional tables based on plugins)

These tables are **separate** from your Lions domain tables (teams, players, games, etc.).

## Troubleshooting

### OAuth Buttons Don't Work

**Problem**: "Click Google" button does nothing
**Solution**: Check that GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set in `.env.local`

### "Invalid redirect URI" Error

**Problem**: OAuth provider says redirect URI is invalid
**Solution**:

- Make sure you added `http://localhost:3000/api/auth/callback/{provider}` to provider settings
- Check for trailing slashes or protocol mismatches
- Restart `npm run dev` after updating environment variables

### Session Not Persisting

**Problem**: User gets logged out immediately
**Solution**:

- Check that BETTER_AUTH_SECRET is set and consistent
- Verify Turso database connection is working
- Check browser cookies are enabled
- Look for errors in browser console (F12 → Console tab)

### Can't Sign Up with Email

**Problem**: Email signup form doesn't work
**Solution**:

- Check that `emailAndPassword: { enabled: true }` is in auth.ts
- Verify `.env.local` has BETTER_AUTH_SECRET set
- Check browser console for error messages
- Restart dev server after making changes

## Security Notes

1. **Secret Management**
   - `BETTER_AUTH_SECRET` should be at least 32 bytes and random
   - Generated with: `openssl rand -base64 32`
   - Never commit to git (in `.env.local` which is gitignored)

2. **OAuth Credentials**
   - Never expose CLIENT_SECRET in frontend code
   - Client secrets are already in `.env.local` (not exposed)
   - Never commit `.env.local` to git

3. **Session Expiry**
   - Better Auth handles session expiry automatically
   - Sessions stored in Turso with TTL
   - User will be logged out on expiry (configurable)

4. **HTTPS in Production**
   - Change `BETTER_AUTH_URL` to `https://yourdomain.com`
   - Update OAuth redirect URIs to use `https`
   - Cookies will be secure (HttpOnly, Secure flags)

## Next Steps

1. ✅ Install better-auth (done)
2. ✅ Create auth files (done)
3. ⬜ Get OAuth credentials (Google & Facebook)
4. ⬜ Update `.env.local` with credentials
5. ⬜ Test login/signup flows
6. ⬜ Protect routes that require authentication
7. ⬜ Deploy to production (update URLs)

## API Reference

### Server-Side (auth.ts)

```typescript
// Create auth instance
import { auth } from "@/lib/auth";

// Use in API routes
const session = await auth.api.getSession({ headers });
```

### Client-Side (auth-client.ts)

```typescript
import { useSession, signIn, signUp, signOut } from "@/lib/auth-client";

// Check current user
const { data: session } = useSession();

// Sign in with email
await signIn.email({ email: "user@example.com", password: "password" });

// Sign in with OAuth
await signIn.social({ provider: "google", callbackURL: "/" });

// Sign out
await signOut();
```

## Documentation

- Better Auth Docs: https://www.betterauth.dev/
- OAuth 2.0 Flow: https://www.betterauth.dev/docs/concepts/oauth
- Session Management: https://www.betterauth.dev/docs/concepts/session-management

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Better Auth documentation
3. Check browser console for error messages (F12)
4. Verify all environment variables are set correctly
