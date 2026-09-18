import { randomUUID } from "node:crypto";
import webpush from "web-push";
import { db } from "@/lib/db";

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  url?: string;
}

interface StoredPushSubscription {
  endpoint: string;
  p256dh: string;
  auth: string;
}

let pushSubscriptionsTableReady: Promise<void> | null = null;

export function getPushConfiguration() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  return {
    publicKey,
    configured: Boolean(publicKey && privateKey && subject),
  };
}

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    throw new Error(
      "Push notifications require NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_SUBJECT",
    );
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
}

async function ensurePushSubscriptionsTable() {
  if (!pushSubscriptionsTableReady) {
    pushSubscriptionsTableReady = db()
      .execute(
        `CREATE TABLE IF NOT EXISTS push_subscriptions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
          endpoint TEXT NOT NULL UNIQUE,
          p256dh TEXT NOT NULL,
          auth TEXT NOT NULL,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )`,
      )
      .then(() => undefined)
      .catch((error) => {
        pushSubscriptionsTableReady = null;
        throw error;
      });
  }

  await pushSubscriptionsTableReady;
}

export function isValidPushSubscription(
  value: unknown,
): value is PushSubscriptionPayload {
  if (!value || typeof value !== "object") return false;

  const payload = value as Partial<PushSubscriptionPayload>;
  if (typeof payload.endpoint !== "string" || payload.endpoint.length > 2048) {
    return false;
  }

  try {
    if (new URL(payload.endpoint).protocol !== "https:") return false;
  } catch {
    return false;
  }

  return Boolean(
    payload.keys &&
      typeof payload.keys.p256dh === "string" &&
      typeof payload.keys.auth === "string" &&
      payload.keys.p256dh.length > 0 &&
      payload.keys.auth.length > 0,
  );
}

export async function hasPushSubscription(userId: string) {
  await ensurePushSubscriptionsTable();

  const result = await db().execute(
    "SELECT 1 FROM push_subscriptions WHERE user_id = ? LIMIT 1",
    [userId],
  );

  return result.rows.length > 0;
}

export async function savePushSubscription(
  userId: string,
  subscription: PushSubscriptionPayload,
) {
  await ensurePushSubscriptionsTable();

  const now = new Date().toISOString();
  await db().execute(
    `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(endpoint) DO UPDATE SET
       user_id = excluded.user_id,
       p256dh = excluded.p256dh,
       auth = excluded.auth,
       updated_at = excluded.updated_at`,
    [
      randomUUID(),
      userId,
      subscription.endpoint,
      subscription.keys.p256dh,
      subscription.keys.auth,
      now,
      now,
    ],
  );
}

export async function removePushSubscription(userId: string, endpoint: string) {
  await ensurePushSubscriptionsTable();
  await db().execute(
    "DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?",
    [userId, endpoint],
  );
}

async function removeExpiredSubscription(endpoint: string) {
  await db().execute("DELETE FROM push_subscriptions WHERE endpoint = ?", [
    endpoint,
  ]);
}

export async function sendPushNotification(
  userId: string,
  payload: PushNotificationPayload,
) {
  configureWebPush();
  await ensurePushSubscriptionsTable();

  const result = await db().execute(
    "SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?",
    [userId],
  );

  let sent = 0;
  let removed = 0;

  for (const row of result.rows as unknown as StoredPushSubscription[]) {
    try {
      await webpush.sendNotification(
        {
          endpoint: row.endpoint,
          keys: {
            p256dh: row.p256dh,
            auth: row.auth,
          },
        },
        JSON.stringify(payload),
      );
      sent += 1;
    } catch (error) {
      const statusCode =
        typeof error === "object" && error !== null && "statusCode" in error
          ? Number(error.statusCode)
          : null;

      if (statusCode === 404 || statusCode === 410) {
        await removeExpiredSubscription(row.endpoint);
        removed += 1;
      } else {
        console.error("Failed to send push notification", error);
      }
    }
  }

  return { sent, removed };
}