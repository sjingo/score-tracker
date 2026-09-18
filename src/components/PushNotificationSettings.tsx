"use client";

import { useEffect, useState } from "react";
import Alert from "@/components/Alert";
import SectionHeading from "@/components/SectionHeading";

interface PushSettingsResponse {
    configured: boolean;
    publicKey: string | null;
    subscribed: boolean;
}

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let index = 0; index < rawData.length; index += 1) {
        outputArray[index] = rawData.charCodeAt(index);
    }

    return outputArray;
}

async function getPushSettings() {
    const response = await fetch("/api/push", { cache: "no-store" });
    const data = (await response.json()) as PushSettingsResponse & { error?: string };

    if (!response.ok) {
        throw new Error(data.error || "Unable to read push notification settings.");
    }

    return data;
}

export default function PushNotificationSettings() {
    const [isSupported, setIsSupported] = useState<boolean | null>(null);
    const [settings, setSettings] = useState<PushSettingsResponse | null>(null);
    const [subscription, setSubscription] = useState<PushSubscription | null>(null);
    const [permission, setPermission] = useState<NotificationPermission>("default");
    const [isBusy, setIsBusy] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let isCancelled = false;

        async function loadPushSettings() {
            const supported =
                "serviceWorker" in navigator &&
                "PushManager" in window &&
                "Notification" in window;

            if (!supported) {
                setIsSupported(false);
                setIsBusy(false);
                return;
            }

            try {
                const registration = await navigator.serviceWorker.register("/sw.js", {
                    scope: "/",
                    updateViaCache: "none",
                });
                const [currentSubscription, currentSettings] = await Promise.all([
                    registration.pushManager.getSubscription(),
                    getPushSettings(),
                ]);

                if (!isCancelled) {
                    setIsSupported(true);
                    setSettings(currentSettings);
                    setSubscription(currentSettings.subscribed ? currentSubscription : null);
                    setPermission(Notification.permission);
                }
            } catch (loadError) {
                if (!isCancelled) {
                    setError(
                        loadError instanceof Error
                            ? loadError.message
                            : "Unable to set up push notifications.",
                    );
                }
            } finally {
                if (!isCancelled) setIsBusy(false);
            }
        }

        void loadPushSettings();

        return () => {
            isCancelled = true;
        };
    }, []);

    async function subscribeToPush() {
        setIsBusy(true);
        setError("");
        setMessage("");

        try {
            const currentSettings = settings ?? (await getPushSettings());
            if (!currentSettings.configured || !currentSettings.publicKey) {
                throw new Error("Push notifications are not configured on the server.");
            }

            const nextPermission = await Notification.requestPermission();
            setPermission(nextPermission);

            if (nextPermission !== "granted") {
                throw new Error("Notification permission was not granted.");
            }

            const registration = await navigator.serviceWorker.ready;
            let nextSubscription = await registration.pushManager.getSubscription();
            let createdSubscription = false;

            if (!nextSubscription) {
                nextSubscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(currentSettings.publicKey),
                });
                createdSubscription = true;
            }

            const response = await fetch("/api/push", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(nextSubscription.toJSON()),
            });
            const data = (await response.json()) as { error?: string };

            if (!response.ok) {
                if (createdSubscription) await nextSubscription.unsubscribe();
                throw new Error(data.error || "Unable to save push subscription.");
            }

            setSubscription(nextSubscription);
            setSettings({ ...currentSettings, subscribed: true });
            setMessage("Push notifications are enabled on this device.");
        } catch (subscribeError) {
            setError(
                subscribeError instanceof Error
                    ? subscribeError.message
                    : "Unable to enable push notifications.",
            );
        } finally {
            setIsBusy(false);
        }
    }

    async function unsubscribeFromPush() {
        if (!subscription) return;

        setIsBusy(true);
        setError("");
        setMessage("");

        try {
            const endpoint = subscription.endpoint;
            await subscription.unsubscribe();
            const response = await fetch("/api/push", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ endpoint }),
            });
            const data = (await response.json()) as { error?: string };

            if (!response.ok) {
                throw new Error(data.error || "Unable to remove push subscription.");
            }

            setSubscription(null);
            setSettings((currentSettings) =>
                currentSettings ? { ...currentSettings, subscribed: false } : currentSettings,
            );
            setMessage("Push notifications are disabled on this device.");
        } catch (unsubscribeError) {
            setError(
                unsubscribeError instanceof Error
                    ? unsubscribeError.message
                    : "Unable to disable push notifications.",
            );
        } finally {
            setIsBusy(false);
        }
    }

    async function sendTestNotification() {
        setIsBusy(true);
        setError("");
        setMessage("");

        try {
            const response = await fetch("/api/push/test", { method: "POST" });
            const data = (await response.json()) as { error?: string };

            if (!response.ok) {
                throw new Error(data.error || "Unable to send test notification.");
            }

            setMessage("Test notification sent.");
        } catch (testError) {
            setError(
                testError instanceof Error
                    ? testError.message
                    : "Unable to send test notification.",
            );
        } finally {
            setIsBusy(false);
        }
    }

    return (
        <section className="mt-8 border-t border-salts-blue pt-6">
            <SectionHeading
                title="Push notifications"
                description="Receive a test notification on this device."
            />

            {isSupported === null && (
                <p className="mt-4 text-sm text-gray-600" role="status">
                    Checking browser support...
                </p>
            )}

            {isSupported === false && (
                <p className="mt-4 text-sm text-gray-600">
                    Push notifications are not supported in this browser.
                </p>
            )}

            {isSupported && !settings?.configured && (
                <p className="mt-4 text-sm text-gray-600">
                    Push notifications need VAPID keys before they can be enabled.
                </p>
            )}

            {isSupported && settings?.configured && !subscription && (
                <div className="mt-4 space-y-3">
                    <button
                        type="button"
                        onClick={() => void subscribeToPush()}
                        disabled={isBusy || permission === "denied"}
                        className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {isBusy ? "Enabling..." : "Enable push notifications"}
                    </button>
                    {permission === "denied" && (
                        <p className="text-sm text-gray-600">
                            Notifications are blocked in this browser. Allow them in the browser settings, then try again.
                        </p>
                    )}
                </div>
            )}

            {isSupported && settings?.configured && subscription && (
                <div className="mt-4 flex flex-wrap gap-3">
                    <button
                        type="button"
                        onClick={() => void sendTestNotification()}
                        disabled={isBusy}
                        className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
                    >
                        {isBusy ? "Sending..." : "Send test notification"}
                    </button>
                    <button
                        type="button"
                        onClick={() => void unsubscribeFromPush()}
                        disabled={isBusy}
                        className="rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:text-gray-400"
                    >
                        Disable
                    </button>
                </div>
            )}

            {error && (
                <Alert className="mt-4">
                    {error}
                </Alert>
            )}
            {message && (
                <Alert tone="success" role="status" className="mt-4">
                    {message}
                </Alert>
            )}
        </section>
    );
}