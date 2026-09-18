"use client";

import { FormEvent, useState } from "react";
import { useSession, authClient } from "@/lib/auth-client";
import Link from "next/link";
import PageContainer from "@/components/PageContainer";
import PageHeader from "@/components/PageHeader";
import SectionHeading from "@/components/SectionHeading";
import Alert from "@/components/Alert";
import Surface from "@/components/Surface";

export default function AccountPage() {
    const { data: session } = useSession();
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmation, setConfirmation] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handlePasswordChange(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setMessage("");
        setError("");

        if (newPassword !== confirmation) {
            setError("New passwords do not match.");
            return;
        }

        setIsLoading(true);

        try {
            const { error: changeError } = await authClient.changePassword({
                currentPassword,
                newPassword,
                revokeOtherSessions: true,
            });

            if (changeError) {
                setError(changeError.message || "Unable to update your password.");
                return;
            }

            setCurrentPassword("");
            setNewPassword("");
            setConfirmation("");
            setMessage("Your password has been updated.");
        } catch (changeError) {
            setError(
                changeError instanceof Error
                    ? changeError.message
                    : "Unable to update your password.",
            );
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
            <PageContainer size="narrow">
                <Surface className="p-5 sm:p-8">
                    <div className="mb-6 flex items-center justify-between">
                        <Link href="/"
                            className="text-blue-500 hover:text-blue-700"
                        >
                            &larr; back
                        </Link>
                    </div>
                    <PageHeader
                        title="My Account"
                        description={<>Signed in as {session?.user.email}</>}
                    />

                    <section className="mt-8 border-t border-salts-blue pt-6">
                        <SectionHeading
                            title="Change password"
                            description="Use your current password to set a new one."
                        />

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

                        <form onSubmit={handlePasswordChange} className="mt-5 space-y-4">
                            <div>
                                <label htmlFor="current-password" className="mb-2 block text-sm font-medium text-gray-700">
                                    Current password
                                </label>
                                <input
                                    id="current-password"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(event) => setCurrentPassword(event.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-salts-blue"
                                    autoComplete="current-password"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="new-password" className="mb-2 block text-sm font-medium text-gray-700">
                                    New password
                                </label>
                                <input
                                    id="new-password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(event) => setNewPassword(event.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-salts-blue"
                                    autoComplete="new-password"
                                    minLength={8}
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="confirm-password" className="mb-2 block text-sm font-medium text-gray-700">
                                    Confirm new password
                                </label>
                                <input
                                    id="confirm-password"
                                    type="password"
                                    value={confirmation}
                                    onChange={(event) => setConfirmation(event.target.value)}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-salts-blue"
                                    autoComplete="new-password"
                                    minLength={8}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
                            >
                                {isLoading ? "Updating password..." : "Update password"}
                            </button>
                        </form>
                    </section>
                </Surface>
            </PageContainer>
        </div>
    );
}