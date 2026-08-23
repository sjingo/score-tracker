# Local Development (Deferred)

This document describes a future local-development option. It is not the current workflow.

Current development and login testing use the configured Turso Cloud database in `.env.local`. Do not replace the cloud `TURSO_DATABASE_URL` with the local URL below while testing the deployed cloud data. See D021 in `DECISION_LOG.md` for the active decision.

The deferred option uses `@libsql/client` from Next.js API routes and a persistent local libSQL server backed by a SQLite file, using the Turso CLI.

## Prerequisites

- Node.js and npm
- Turso CLI installed and available as `turso`
- Dependencies installed with `npm install`

Check the CLI installation:

```powershell
turso --version
```

## Start a persistent local database

From the project directory, start the local libSQL server:

```powershell
turso dev --db-file local.db
```

The server listens on `http://127.0.0.1:8080`. Keep this terminal running while developing. The `--db-file local.db` option persists changes in the project directory; stopping the server does not discard them.

## Configure the app for the Deferred Local Workflow

Create or update `.env.local` with local values:

```env
TURSO_DATABASE_URL=http://127.0.0.1:8080
TURSO_AUTH_TOKEN=local-development-only
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=replace-with-a-local-secret
```

The application requires `TURSO_AUTH_TOKEN` to be present even for local development. The local value above is a placeholder. This configuration is for a later date and must not be used for current cloud login testing.

`.env.local` is ignored by git and must never be committed.

## Initialize the local schema

With `turso dev` still running, open a second terminal in the project directory:

```powershell
npm run setup:db
```

This creates the application tables and seeds the local Lions data and development admin account. The seeded credentials are defined in the setup script. Change the password before using any shared or production database.

## Run the application

```powershell
npm run dev
```

Open [http://localhost:3000/login](http://localhost:3000/login).

To stop development, stop the Next.js process and the `turso dev` process. Keep `local.db` if you want to preserve local data. Delete it only when a clean local database is required.

## Inspect the local database

Use the Turso CLI against the local server:

```powershell
turso db shell --url http://127.0.0.1:8080 "SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name;"
turso db shell --url http://127.0.0.1:8080 "PRAGMA table_info(users);"
```

If the installed CLI does not support `--url`, use a SQLite GUI such as DBeaver or Beekeeper Studio and open `local.db` while the server is stopped.

## Local file alternative

A local SQLite file can also be opened directly with a Turso-compatible SDK. This project currently uses `@libsql/client`, which is configured for the local HTTP server above. Do not switch the app to a different driver without updating `src/lib/db.ts` and validating all API routes.

## Remote versus local

Local development is isolated from Turso Cloud. Local schema changes and data do not change the remote database. To inspect the remote schema, use the Turso dashboard SQL editor or the CLI against the cloud database, and never paste the auth token into source control or chat:

```sql
PRAGMA table_info(users);
PRAGMA table_info(account);
```

Before running a migration against the remote database, export a backup and verify the target database name. `CREATE TABLE IF NOT EXISTS` does not alter an existing table, so it cannot repair an old schema by itself.
