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
        try {
            await signIn.email({ email, password });
            router.push("/");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to sign in. Please check your credentials.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6">
                <h1 className="text-3xl font-bold text-center mb-2 text-gray-900" sr-only>
                    Login
                </h1>
                <p className="text-center text-gray-600 mb-8">Sign in to your account</p>

                {error && (
                    <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                    >
                        {isLoading ? "Signing in..." : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    );
}
