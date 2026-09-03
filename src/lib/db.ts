import { createClient } from "@libsql/client";

let db: ReturnType<typeof createClient> | null = null;

function getDb() {
  if (db) return db;

  if (!process.env.TURSO_DATABASE_URL) {
    throw new Error("TURSO_DATABASE_URL environment variable is not set");
  }

  if (!process.env.TURSO_AUTH_TOKEN) {
    throw new Error("TURSO_AUTH_TOKEN environment variable is not set");
  }

  db = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  return db;
}

export { getDb as db };
