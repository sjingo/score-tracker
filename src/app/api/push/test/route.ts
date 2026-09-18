import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticated } from "@/lib/authorization";
import { getPushConfiguration, sendPushNotification } from "@/lib/push";

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
    const result = await sendPushNotification(authorization.user.id, {
      title: "Lions Score Tracker",
      body: "Push notifications are working on this device.",
      url: "/account",
    });

    if (result.sent === 0) {
      return NextResponse.json(
        { success: false, error: "No active push subscription found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("[POST /api/push/test] Error:", error);
    return NextResponse.json(
      { success: false, error: "Unable to send test notification" },
      { status: 500 },
    );
  }
}
