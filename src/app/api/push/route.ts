import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticated } from "@/lib/authorization";
import {
  getPushConfiguration,
  hasPushSubscription,
  isValidPushSubscription,
  removePushSubscription,
  savePushSubscription,
} from "@/lib/push";

export async function GET(request: NextRequest) {
  const authorization = await requireAuthenticated(request);
  if (authorization instanceof Response) return authorization;

  try {
    const configuration = getPushConfiguration();
    const subscribed = await hasPushSubscription(authorization.user.id);

    return NextResponse.json({
      configured: configuration.configured,
      publicKey: configuration.publicKey ?? null,
      subscribed,
    });
  } catch (error) {
    console.error("[GET /api/push] Error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to read push notification settings" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const authorization = await requireAuthenticated(request);

  if (authorization instanceof Response) return authorization;

  if (!getPushConfiguration().configured) {
    return NextResponse.json(
      { success: false, error: "Push notifications are not configured" },
      { status: 503 },
    );
  }

  try {
    const body: unknown = await request.json();

    if (!isValidPushSubscription(body)) {
      return NextResponse.json(
        { success: false, error: "Invalid push subscription" },
        { status: 400 },
      );
    }

    await savePushSubscription(authorization.user.id, body);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[POST /api/push] Error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to save push subscription" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const authorization = await requireAuthenticated(request);

  if (authorization instanceof Response) return authorization;

  try {
    const body = (await request.json()) as { endpoint?: unknown };

    if (typeof body.endpoint !== "string" || body.endpoint.length > 2048) {
      return NextResponse.json(
        { success: false, error: "A valid subscription endpoint is required" },
        { status: 400 },
      );
    }

    await removePushSubscription(authorization.user.id, body.endpoint);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[DELETE /api/push] Error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to remove push subscription" },
      { status: 500 },
    );
  }
}
