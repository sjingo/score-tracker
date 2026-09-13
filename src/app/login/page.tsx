"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
                <h1 className="text-3xl font-bold text-center mb-2 text-gray-900">
                    Login
                </h1>
                <p className="text-center text-gray-600 mb-8">Sign in to your account</p>

                {error && (
                    <div role="alert" className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Email Sign In Form */}
                <form onSubmit={handleEmailSignIn} className="space-y-4 mb-6">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-2">
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-salts-blue"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium mb-2">
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-salts-blue"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        aria-busy={isLoading}
                        className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                    >
                        {isLoading ? "Checking your details..." : "Sign In"}
                    </button>
                    {isLoading && (
                        <p className="text-center text-sm text-gray-500" role="status">
                            Connecting securely. This can take a few seconds.
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}
