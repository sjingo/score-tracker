# Testing Guide: Server-Side Proxy Authentication

**Purpose**: Verify the new proxy-based authentication is working correctly  
**Estimated Time**: 10-15 minutes  
**Prerequisites**: Dev server running (`npm run dev`)

---

## Pre-Test Checklist

Before starting tests, verify:

- [ ] Admin user exists in Turso with valid password
- [ ] Proxy routes created:
  - [ ] `src/app/api/proxy/sign-in/route.ts`
  - [ ] `src/app/api/proxy/sign-out/route.ts`
- [ ] Auth hook created: `src/lib/auth-proxy.ts`
- [ ] Login page updated: `src/app/login/page.tsx`
- [ ] Middleware exists: `src/middleware.ts`
- [ ] Dev server running: `npm run dev`

---

## Test Suite 1: Network Security

### Objective

Verify that credentials are NOT exposed in network traffic

### Setup

1. Open `http://localhost:3000/login` in Chrome/Firefox
2. Right-click → Inspect or Press `F12`
3. Open DevTools → Network tab
4. Clear any existing requests (click circle icon)
5. Leave DevTools open

### Test 1.1: Login Request Shows Proxy Route

**Steps**:

1. In login form, enter:
   - Email: `s.j.ingolfsson@gmail.com`
   - Password: (your admin password)
2. Click "Sign In"
3. Look for request in Network tab

**Expected Results**:

- ✅ Request appears: `POST /api/proxy/sign-in`
- ✅ Status: `200` (success)
- ❌ NO requests to external auth services
- ❌ NO requests to `/api/auth/` endpoints

**Verification**:

```
Network Tab →
  Filter: "proxy"
    Should show: POST /api/proxy/sign-in
```

### Test 1.2: Request Body Shows Credentials (Internal Only)

**Steps**:

1. In Network tab, click `POST /api/proxy/sign-in`
2. Open → Request tab
3. Scroll to "Request Payload"

**Expected Results**:

- ✅ Shows: `{ email: "s.j.ingolfsson@gmail.com", password: "..." }`
- ✅ These credentials only visible within your network (not external)
- ℹ️ This is expected and secure (internal to your server)

**Verification**:

```json
{
  "email": "s.j.ingolfsson@gmail.com",
  "password": "YourPasswordHere"
}
```

### Test 1.3: Response Includes Session Cookie

**Steps**:

1. Click same `POST /api/proxy/sign-in` request
2. Open → Response tab
3. Look for `Set-Cookie` header

**Expected Results**:

- ✅ Response header shows: `Set-Cookie: better-auth.session-token=...`
- ✅ Cookie has flags: `HttpOnly; SameSite=Lax; Path=/`

**Verification**:

```
Set-Cookie: better-auth.session-token=eyJ...blah....;
  HttpOnly;
  SameSite=Lax;
  Path=/
```

### Test 1.4: No Credentials in Browser Storage

**Steps**:

1. Press `F12` → DevTools open
2. Open → Application tab
3. Left sidebar → Local Storage → Select `http://localhost:3000`
4. Inspect all keys and values

**Expected Results**:

- ✅ No `password` key
- ✅ No `token` key with actual credentials
- ✅ No raw credentials anywhere

**Verification**:

```
Local Storage should be empty or contain only app settings
NOT:
  - "password": "..."
  - "auth_token": "..."
  - "user_password": "..."
```

### Test 1.5: Cookie Stored (Not Accessible to JavaScript)

**Steps**:

1. Press `F12` → DevTools open
2. Open → Application tab
3. Left sidebar → Cookies → Select `http://localhost:3000`
4. Look for `better-auth.session-token`

**Expected Results**:

- ✅ Cookie exists: `better-auth.session-token`
- ✅ Cookie is marked: `HttpOnly` (yes)
- ✅ Cookie is marked: `SameSite` (Lax or Strict)

**Verification**:

```
Name:             better-auth.session-token
Value:            eyJ...
Domain:           localhost
Path:             /
HttpOnly:         ✓ (checked)
SameSite:         Lax
```

---

## Test Suite 2: Authentication Flow

### Objective

Verify that login/logout flows work correctly

### Test 2.1: Successful Login

**Steps**:

1. Navigate to `http://localhost:3000/login`
2. Enter valid credentials:
   - Email: `s.j.ingolfsson@gmail.com`
   - Password: (correct password)
3. Click "Sign In"

**Expected Results**:

- ✅ "Signing in..." text appears briefly
- ✅ Redirects to dashboard (`http://localhost:3000/`)
- ✅ Dashboard loads (see Games and Players tabs)
- ✅ Header shows "Sign Out" button
- ✅ Header shows user email

**Verification**:

```
URL: http://localhost:3000/
Content: Games tab, Players tab visible
Header: Shows user email + Sign Out button
```

### Test 2.2: Failed Login - Invalid Password

**Steps**:

1. Navigate to `http://localhost:3000/login`
2. Enter credentials:
   - Email: `s.j.ingolfsson@gmail.com`
   - Password: `WrongPassword123`
3. Click "Sign In"

**Expected Results**:

- ✅ "Signing in..." appears briefly
- ✅ Error message: `Invalid email or password`
- ✅ Stays on login page (`http://localhost:3000/login`)
- ✅ Form fields retain values (except password can be cleared)

**Verification**:

```
Error visible: "Invalid email or password"
URL: Still http://localhost:3000/login
```

### Test 2.3: Failed Login - Invalid Email

**Steps**:

1. Navigate to `http://localhost:3000/login`
2. Enter credentials:
   - Email: `nonexistent@example.com`
   - Password: (any password)
3. Click "Sign In"

**Expected Results**:

- ✅ Error message: `Invalid email or password`
- ✅ Stays on login page

**Verification**:

```
Error visible: "Invalid email or password"
(Doesn't reveal whether email exists or not - security)
```

### Test 2.4: Successful Logout

**Steps**:

1. (After successful login) See dashboard
2. Click "Sign Out" button (top right)

**Expected Results**:

- ✅ "Signing out..." text appears briefly
- ✅ Redirects to login page (`http://localhost:3000/login`)
- ✅ Session cookie is cleared

**Verification**:

```
URL: http://localhost:3000/login
DevTools → Application → Cookies: better-auth.session-token is GONE
```

### Test 2.5: Session Persists on Page Refresh

**Steps**:

1. (After successful login) See dashboard
2. Press `F5` to refresh page
3. Page loads

**Expected Results**:

- ✅ Dashboard still shows (no redirect to login)
- ✅ Session cookie sent automatically
- ✅ User still logged in

**Verification**:

```
URL: Still http://localhost:3000/
Content: Dashboard loads with data
Header: Still shows user email
```

---

## Test Suite 3: Protected Routes

### Objective

Verify that unauthenticated users cannot access protected routes

### Test 3.1: Unauthenticated Access to Dashboard

**Steps**:

1. Logout first (if logged in)
2. Delete session cookie:
   - DevTools → Application → Cookies → Delete `better-auth.session-token`
3. Navigate to `http://localhost:3000/`

**Expected Results**:

- ✅ Redirects to `http://localhost:3000/login`
- ✅ Cannot see dashboard

**Verification**:

```
URL redirects to: http://localhost:3000/login
Cannot see Games or Players content
```

### Test 3.2: Unauthenticated Access to Debug Page

**Steps**:

1. Logout first (if logged in)
2. Navigate to `http://localhost:3000/debug`

**Expected Results**:

- ✅ Redirects to `http://localhost:3000/login`

**Verification**:

```
URL redirects to: http://localhost:3000/login
```

### Test 3.3: Unauthenticated API Request

**Steps**:

1. Open DevTools → Console
2. Run:
   ```javascript
   fetch("/api/games")
     .then((r) => r.json())
     .then((d) => console.log(d));
   ```

**Expected Results**:

- ✅ Returns: `{ error: "Unauthorized" }`
- ✅ Status: `401`

**Verification**:

```javascript
> { error: "Unauthorized" }
```

### Test 3.4: Authenticated API Request

**Steps**:

1. Login first (see Test 2.1)
2. Open DevTools → Console
3. Run:
   ```javascript
   fetch("/api/games")
     .then((r) => r.json())
     .then((d) => console.log(d));
   ```

**Expected Results**:

- ✅ Returns: Game data (array of games)
- ✅ Status: `200`

**Verification**:

```javascript
> [{id: "...", opposition_name: "...", ...}, ...]
```

---

## Test Suite 4: Network Comparison

### Objective

Compare network traffic before and after refactoring

### Setup

Open DevTools Network tab, clear requests, and perform actions

### Test 4.1: Login Network Trace

**Steps**:

1. Clear Network tab
2. Login with valid credentials
3. Wait for redirect

**Expected Network Requests**:

```
POST /api/proxy/sign-in         (200)  ← Your proxy endpoint
                                       ← Contains: { email, password }
                                       ← Response: Set-Cookie header
                                       ← (ONLY to your server)

POST /api/proxy/sign-in         (Possible: may retry if network issue)

GET  /                          (200)  ← Dashboard page
GET  /api/games                 (200)  ← Games data
GET  /api/players               (200)  ← Players data
```

**❌ Should NOT See**:

```
POST /api/auth/sign-in/email          ← External auth library
POST /api/auth/callback/...           ← OAuth callback
POST https://accounts.google.com/...  ← Google auth
```

### Test 4.2: Logout Network Trace

**Steps**:

1. Clear Network tab
2. Click "Sign Out" button
3. Wait for redirect

**Expected Network Requests**:

```
POST /api/proxy/sign-out        (200)  ← Your proxy endpoint
                                       ← NO credentials in body
                                       ← Response: Set-Cookie with Max-Age=0

GET  /login                     (200)  ← Login page
```

**❌ Should NOT See**:

```
Any credentials in network requests
Any external auth service calls
```

---

## Test Suite 5: Security Headers

### Objective

Verify HTTP security headers are set correctly

### Steps

1. Login successfully
2. DevTools → Network tab
3. Click any `/api/` request
4. Open → Response Headers

### Expected Headers

```
Set-Cookie: better-auth.session-token=...; HttpOnly; SameSite=Lax
Content-Type: application/json
Cache-Control: (appropriate for endpoint)
```

### Verify

- [ ] HttpOnly flag present (prevents JavaScript access)
- [ ] SameSite flag present (CSRF protection)
- [ ] Path=/ (sent to all paths)

---

## Troubleshooting Tests

### If Login Fails

**Problem**: POST /api/proxy/sign-in returns 401

**Steps**:

1. Check admin user exists:
   ```sql
   SELECT email FROM user LIMIT 1;
   ```
2. Verify password is hashed correctly:
   ```sql
   SELECT password FROM user WHERE email = 's.j.ingolfsson@gmail.com';
   -- Should look like: $2b$12$...
   ```
3. Test with known good password (use hash-password.ts to generate)

### If Redirect Doesn't Work

**Problem**: Login succeeds but doesn't redirect

**Steps**:

1. Check browser console for errors (F12)
2. Verify response includes `redirect: "/"` in JSON
3. Check network request:
   - Response should have status 200
   - Response should have Set-Cookie header

### If Cookie Not Saved

**Problem**: Session cookie doesn't appear in Application tab

**Steps**:

1. Check Set-Cookie header in response:
   ```
   Network Tab → POST /api/proxy/sign-in → Response
   ```
2. Verify `HttpOnly` not blocking
3. Check Domain matches (should be localhost for dev)
4. Restart browser and try again

### If Middleware Always Redirects

**Problem**: Always redirected to login even after successful login

**Steps**:

1. Verify middleware.ts exists: `ls src/middleware.ts`
2. Check cookie is being sent:
   ```
   Network Tab → Any request → Request Headers → Cookie
   Should show: better-auth.session-token=...
   ```
3. Verify session exists in Turso:
   ```sql
   SELECT * FROM session LIMIT 1;
   ```

---

## Automated Test Script (Optional)

You can create a test script to run all checks:

**File**: `scripts/test-auth.sh`

```bash
#!/bin/bash

echo "🧪 Testing Server-Side Proxy Authentication"
echo ""

# Test 1: Check files exist
echo "1️⃣  Checking files..."
[ -f src/app/api/proxy/sign-in/route.ts ] && echo "✅ Proxy sign-in route exists" || echo "❌ Missing proxy sign-in"
[ -f src/app/api/proxy/sign-out/route.ts ] && echo "✅ Proxy sign-out route exists" || echo "❌ Missing proxy sign-out"
[ -f src/lib/auth-proxy.ts ] && echo "✅ Auth proxy hook exists" || echo "❌ Missing auth proxy hook"

# Test 2: Check imports in login page
echo ""
echo "2️⃣  Checking login page imports..."
grep -q "useAuthProxy" src/app/login/page.tsx && echo "✅ Login uses auth proxy" || echo "❌ Login not using proxy"

# Test 3: Check middleware exists
echo ""
echo "3️⃣  Checking middleware..."
[ -f src/middleware.ts ] && echo "✅ Middleware exists" || echo "❌ Missing middleware"

echo ""
echo "✅ All files in place! Run 'npm run dev' to test."
```

Run it:

```bash
chmod +x scripts/test-auth.sh
./scripts/test-auth.sh
```

---

## Success Criteria

All tests pass when:

- ✅ Login redirects to dashboard with session cookie
- ✅ Network tab shows only `/api/proxy/*` endpoints (no external auth)
- ✅ Credentials visible in one POST request only (to your server)
- ✅ Session cookie is HttpOnly (not in localStorage)
- ✅ Logout clears session
- ✅ Unauthenticated users redirected to login
- ✅ API routes require valid session
- ✅ Page refresh maintains session

---

## Performance Baseline

These are expected timing (for reference):

| Action                | Expected Time                        |
| --------------------- | ------------------------------------ |
| Login request         | 50-100ms                             |
| Password verification | 100-150ms (bcrypt is slow by design) |
| Total login flow      | 500-1000ms (including redirect)      |
| API requests          | 10-50ms (with valid session)         |
| Logout                | 50-100ms                             |

---

## Next Steps After Testing

Once all tests pass:

1. Commit to git:

   ```bash
   git add .
   git commit -m "refactor: move to server-side proxy authentication"
   ```

2. Clean up old files (optional):

   ```bash
   rm src/lib/auth-client.ts  # If not used elsewhere
   rm src/app/actions/auth.ts  # If not used elsewhere
   ```

3. Document findings in team wiki
4. Monitor server logs for auth issues
5. Consider adding rate limiting (future)

---

## Questions?

If any test fails, refer to:

- `AUTH_PROXY_ARCHITECTURE.md` - Technical details
- `REFACTORING_SUMMARY.md` - Changes summary
- Proxy route code comments - Implementation details

---

**Ready to Test?**

Start with Test Suite 1 (Network Security) to verify credentials are protected!
