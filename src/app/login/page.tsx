"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Alert from "@/components/Alert";
import Surface from "@/components/Surface";

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleEmailSignIn(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        setError("");
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 15000);

        try {
            const result = await signIn.email({
                email: email.trim().toLowerCase(),
                password,
                fetchOptions: {
                    signal: controller.signal,
                },
            });

            if (result.error) {
                if (result.error.status === 401) {
                    setError("Invalid email or password. Please try again.");
                } else {
                    setError(result.error.message || "Unable to sign in. Please try again.");
                }
                return;
            }

            router.push("/");
        } catch (err) {
            if (err instanceof DOMException && err.name === "AbortError") {
                setError("Sign-in timed out. Please check your connection and try again.");
            } else if (err instanceof TypeError) {
                setError("Unable to reach the sign-in service. Please check your connection and try again.");
            } else {
                setError(err instanceof Error ? err.message : "Unable to sign in. Please try again.");
            }
        } finally {
            window.clearTimeout(timeoutId);
            setIsLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-3 py-6 sm:px-4 sm:py-8">
            <Surface className="w-full max-w-md p-5 sm:p-6">
                <h1 className="mb-2 text-center text-2xl font-bold text-gray-900 sm:text-3xl">
                    Login
                </h1>
                <p className="mb-6 text-center text-sm text-gray-600 sm:mb-8">Sign in to your account</p>

                {error && (
                    <Alert className="mb-4">
                        {error}
                    </Alert>
                )}

                {/* Email Sign In Form */}
                <form onSubmit={handleEmailSignIn} className="mb-6 space-y-4">
                    <div>
                        <label htmlFor="email" className="mb-2 block text-sm font-medium">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                            autoComplete="email"
                            disabled={isLoading}
                            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-salts-blue sm:px-4 sm:py-2"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="mb-2 block text-sm font-medium">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Your password"
                            autoComplete="current-password"
                            disabled={isLoading}
                            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-salts-blue sm:px-4 sm:py-2"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        aria-busy={isLoading}
                        className="w-full rounded-lg bg-blue-600 px-3 py-1.5 font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400 sm:px-4 sm:py-2"
                    >
                        {isLoading ? "Checking your details..." : "Sign In"}
                    </button>
                    {isLoading && (
                        <p className="text-center text-sm text-gray-500" role="status">
                            Connecting securely. This can take a few seconds.
                        </p>
                    )}
                </form>
            </Surface>
        </div>
    );
}
