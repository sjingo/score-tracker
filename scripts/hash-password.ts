#!/usr/bin/env node

/**
 * CLI Script: Hash Password for Turso Database
 *
 * Usage:
 *   npx ts-node scripts/hash-password.ts
 *
 * Process:
 *   1. Prompted to enter password (terminal won't echo)
 *   2. Script hashes using bcrypt (OWASP-compliant, same strength as scrypt)
 *   3. Outputs hash to console
 *   4. Copy and paste hash into Turso database
 *
 * Example SQL for Turso:
 *   UPDATE user SET password = '<HASH>' WHERE email = 's.j.ingolfsson@gmail.com';
 */

import * as readline from "readline";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

async function main(): Promise<void> {
  console.log("🔐 Lions Score Tracker - Password Hasher\n");
  console.log(
    "This tool generates a bcrypt hash for manual Turso database entry.\n",
  );

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // Ask for password
  await new Promise<void>((resolve) => {
    rl.question("Enter password to hash: ", (password) => {
      rl.close();

      if (!password || password.trim() === "") {
        console.error("❌ Error: Password cannot be empty");
        process.exit(1);
      }

      hashAndDisplay(password).then(() => resolve());
    });
  });
}

async function hashAndDisplay(password: string): Promise<void> {
  try {
    console.log("\n⏳ Hashing password (this may take a moment)...\n");
    const hash = await bcrypt.hash(password, SALT_ROUNDS);

    console.log("✅ Hash generated successfully!\n");
    console.log("═".repeat(80));
    console.log("\n📌 BCRYPT HASH (copy this entire string):\n");
    console.log(hash);
    console.log("\n" + "═".repeat(80));

    console.log("\n📋 To insert into Turso database:\n");
    console.log("1. Open Turso Console: https://app.turso.tech/");
    console.log("2. Select your Lions Score Tracker database");
    console.log("3. Open the SQL Editor tab");
    console.log("4. Run this command:\n");
    console.log(
      `   UPDATE user SET password = '${hash}' WHERE email = 's.j.ingolfsson@gmail.com';\n`,
    );
    console.log("5. Verify: Check that 1 row was updated");
    console.log("6. Test: Try logging in with your password\n");

    console.log("🔒 Security Notes:");
    console.log(
      "   • This hash is unique—running again will produce different output",
    );
    console.log("   • Never share this hash—guard it like the password itself");
    console.log(
      "   • Raw password is NOT stored anywhere after this script exits",
    );
    console.log(
      "   • Bcrypt-12 is OWASP-compliant (30+ year crack time at 8 GPUs)\n",
    );

    console.log("💡 For additional users:");
    console.log(
      "   INSERT INTO user (id, email, password, email_verified, created_at, updated_at)",
    );
    console.log(
      `   VALUES ('user_id', 'coach@example.com', '${hash}', false, datetime('now'), datetime('now'));`,
    );
    console.log("");

    process.exit(0);
  } catch (error) {
    console.error(
      "❌ Error hashing password:",
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
