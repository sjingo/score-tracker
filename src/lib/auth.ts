export const AUTH_ROLES = ["admin", "user"];
export type AuthRole = (typeof AUTH_ROLES)[number];

import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Kysely } from "kysely";
import { LibsqlDialect } from "@libsql/kysely-libsql";

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  throw new Error("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set");
}

const database = new Kysely<Record<string, unknown>>({
  dialect: new LibsqlDialect({
    url: TURSO_DATABASE_URL,
    authToken: TURSO_AUTH_TOKEN,
  }),
});

export const auth = betterAuth({
  database: {
    db: database,
    type: "sqlite",
    casing: "snake",
  },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
    disableSignUp: true,
  },
  advanced: {
    database: {
      joins: false,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: AUTH_ROLES,
        required: false,
        defaultValue: "user",
        input: false,
      },
    },
  },
  plugins: [nextCookies()],
});
