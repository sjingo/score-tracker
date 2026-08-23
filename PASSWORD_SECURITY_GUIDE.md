# Password Security & MFA Guide - Lions Score Tracker

## Overview

This document outlines password security practices and MFA options for the Lions Score Tracker admin authentication system.

---

## Current Security Setup

### Password Hashing: bcrypt

**Algorithm**: bcrypt with 12 salt rounds

```typescript
// In src/lib/password.ts
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### Security Analysis

| Metric                   | Value     | Assessment                       |
| ------------------------ | --------- | -------------------------------- |
| **Algorithm**            | bcrypt    | Industry standard                |
| **Salt Rounds**          | 12        | OWASP recommended (10-12)        |
| **Hash Length**          | 60 chars  | Full bcrypt output               |
| **Time per hash**        | ~100ms    | Resistant to brute force         |
| **Estimated crack time** | 30+ years | 8 GPU cards, 9.6B hashes/sec     |
| **OWASP Status**         | A02:2021  | Cryptographic Failures compliant |

### Default Admin Password

- **Email**: s.j.ingolfsson@gmail.com
- **Password**: ChangeMe@123
- **Action**: **MUST change immediately after first login**

---

## Multi-Factor Authentication (MFA)

### Option 1: TOTP (Time-based One-Time Password) ⭐ RECOMMENDED

**Best for**: Admin accounts, sports coaching apps

**User Experience**:

- User scans QR code with authenticator app
- App generates 6-digit code every 30 seconds
- User enters code at login

**Supported Apps**:

- Google Authenticator (free, iOS/Android)
- Authy (free, iOS/Android)
- Microsoft Authenticator (free, iOS/Android)
- FreeOTP (free, open-source)

**Implementation**:

```bash
npm install speakeasy qrcode
```

**Schema Addition**:

```sql
ALTER TABLE users ADD COLUMN mfa_secret TEXT;
ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN DEFAULT 0;
```

**Code Example**:

```typescript
// Generate TOTP secret
import speakeasy from "speakeasy";

const secret = speakeasy.generateSecret({
  name: `Lions Score Tracker (${email})`,
  issuer: "Lions",
});

// secret.base32 - store in DB
// secret.qr_code_svg - show to user for scanning

// Verify TOTP code
const verified = speakeasy.totp.verify({
  secret: mfaSecret,
  encoding: "base32",
  token: userProvidedCode,
  window: 2, // Allow ±2 time windows (60 seconds)
});
```

**Pros**:

- No dependency on email delivery
- Works offline (phone doesn't need internet)
- Free for users
- Industry standard (used by GitHub, Google, Microsoft)

**Cons**:

- User must have authenticator app installed
- Account locked if device lost (need backup codes)

---

### Option 2: Email-Based OTP (One-Time Password)

**Best for**: Simplicity, no app installation needed

**User Experience**:

- User enters email and password
- 6-digit code sent to email
- User enters code to complete login

**Implementation**:

```typescript
// Generate and email 6-digit code
const code = Math.random().toString().slice(-6).padStart(6, "0");
const expiryTime = Date.now() + 10 * 60 * 1000; // 10 minutes

// Store in database
await db.execute(
  `INSERT INTO login_codes (email, code, expires_at) VALUES (?, ?, ?)`,
  [email, code, new Date(expiryTime).toISOString()],
);

// Send email (using your email service)
await sendEmail(email, `Your login code: ${code}. Valid for 10 minutes.`);
```

**Schema Addition**:

```sql
CREATE TABLE login_codes (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  attempts INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_login_codes_email ON login_codes(email);
```

**Pros**:

- No app installation needed
- Works on any device
- Simple for users to understand

**Cons**:

- Depends on email delivery (can be slow/unreliable)
- Slightly more vulnerable than TOTP
- Requires email service integration

---

### Option 3: Backup Codes (Recommended with TOTP)

**Purpose**: Account recovery if MFA device is lost

**User Experience**:

- 8-10 one-time use codes generated
- User prints/saves them securely
- Used as fallback when app unavailable

**Implementation**:

```typescript
import { randomUUID } from "crypto";

function generateBackupCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    // Format: XXXX-XXXX-XXXX (3 groups of 4 hex chars)
    const code = randomUUID().replace(/-/g, "").slice(0, 12);
    const formatted = code.match(/.{1,4}/g)!.join("-");
    codes.push(formatted);
  }
  return codes;
}

// Store hashed codes
const hashedCodes = await Promise.all(
  backupCodes.map((code) => hashPassword(code)),
);
```

**Schema Addition**:

```sql
CREATE TABLE backup_codes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

**Pros**:

- Account recovery without admin intervention
- Simple fallback mechanism

**Cons**:

- Users must store securely
- One-time use only

---

## Recommended MFA Implementation Path

### Phase 1 (Immediate)

- ✅ bcrypt password hashing (DONE)
- Default password enforcement to change on first login

### Phase 2 (Within 1 week)

- Implement TOTP as primary MFA
- Add MFA setup wizard (QR code + backup codes)
- Require TOTP for all admin accounts

### Phase 3 (Optional)

- Add email-based fallback if TOTP device unavailable
- Implement backup codes recovery system

### Phase 4 (Future)

- WebAuthn/FIDO2 (hardware keys)
- Passwordless login (email link)

---

## Implementation Checklist

### Add to `src/lib/password.ts`:

```typescript
// Generate backup codes
export function generateBackupCodes(count = 10): string[] {
  // Implementation here
}

// Validate password strength
export function validatePassword(password: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (password.length < 12)
    errors.push("Password must be at least 12 characters");
  if (!/[A-Z]/.test(password)) errors.push("Must contain uppercase letter");
  if (!/[a-z]/.test(password)) errors.push("Must contain lowercase letter");
  if (!/[0-9]/.test(password)) errors.push("Must contain number");
  if (!/[!@#$%^&*]/.test(password))
    errors.push("Must contain special character (!@#$%^&*)");

  return { valid: errors.length === 0, errors };
}
```

### Add to database schema:

```sql
-- MFA columns
ALTER TABLE users ADD COLUMN mfa_secret TEXT;
ALTER TABLE users ADD COLUMN mfa_enabled BOOLEAN DEFAULT 0;
ALTER TABLE users ADD COLUMN mfa_setup_at TEXT;

-- Backup codes table
CREATE TABLE backup_codes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Create API endpoints:

- `POST /api/auth/mfa/setup` - Initiate TOTP setup
- `POST /api/auth/mfa/verify` - Verify TOTP during login
- `POST /api/auth/mfa/backup-codes` - Recover with backup code
- `POST /api/auth/password/change` - Force change default password

---

## Security Best Practices

### For Admin Users

1. ✅ Change default password immediately
2. 📱 Set up MFA (TOTP) on day 1
3. 💾 Store backup codes in secure location (password manager)
4. 🔄 Rotate password every 90 days
5. 🚫 Never share credentials
6. 🔐 Use strong passwords: 14+ chars, mixed case, numbers, symbols

### For App

1. ✅ Hash all passwords with bcrypt (DONE)
2. 🔒 Use HTTPS/TLS in production
3. 🛡️ Implement rate limiting on login attempts
4. 📝 Log all authentication events
5. 🚨 Alert on suspicious activity (multiple failed attempts)
6. ⏱️ Session timeout after 30 minutes of inactivity

### Never

- ❌ Log passwords
- ❌ Send passwords in emails
- ❌ Store passwords in plain text
- ❌ Use weak hashing (MD5, SHA1, SHA256 without salt)
- ❌ Reuse credentials across services

---

## Testing

### Test bcrypt hashing

```typescript
import { hashPassword, verifyPassword } from "@/lib/password";

async function testBcrypt() {
  const password = "TestPassword123!";
  const hash = await hashPassword(password);

  console.log("Hash:", hash); // $2b$12$...

  const isValid = await verifyPassword(password, hash);
  console.log("Valid:", isValid); // true

  const isInvalid = await verifyPassword("WrongPassword", hash);
  console.log("Invalid:", isInvalid); // false
}
```

### Test login endpoint

```bash
# Success
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"s.j.ingolfsson@gmail.com","password":"ChangeMe@123"}'

# Failure
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"s.j.ingolfsson@gmail.com","password":"WrongPassword"}'
```

---

## Resources

- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [bcrypt npm documentation](https://www.npmjs.com/package/bcrypt)
- [speakeasy TOTP library](https://www.npmjs.com/package/speakeasy)
- [NIST Digital Identity Guidelines](https://pages.nist.gov/800-63-3/)
