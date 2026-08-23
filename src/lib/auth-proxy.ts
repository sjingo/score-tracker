/**
 * Client-side authentication utilities using the proxy API routes
 *
 * These functions POST to /api/proxy/sign-in and /api/proxy/sign-out
 * which delegate to Better Auth server-side (keeping credentials off external network).
 *
 * Usage:
 *   import { useAuthProxy } from "@/lib/auth-proxy";
 *
 *   const { signIn, signOut, isLoading, error } = useAuthProxy();
 *   await signIn(email, password);
 *   await signOut();
 */

import { useState } from "react";

export interface AuthProxyError {
  message: string;
  status?: number;
}

export function useAuthProxy() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AuthProxyError | null>(null);

  const signIn = async (
    email: string,
    password: string,
    onSuccess?: () => void,
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/proxy/sign-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Important: include cookies in request
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const err: AuthProxyError = {
          message: data.error || "Sign in failed",
          status: response.status,
        };
        setError(err);
        return {
          success: false,
          error: err.message,
        };
      }

      // Success: call callback if provided
      if (onSuccess) {
        onSuccess();
      }

      return { success: true };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      const authError: AuthProxyError = { message };
      setError(authError);
      return {
        success: false,
        error: message,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (
    onSuccess?: () => void,
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/proxy/sign-out", {
        method: "POST",
        credentials: "include", // Important: include cookies in request
      });

      const data = await response.json();

      if (!response.ok) {
        const err: AuthProxyError = {
          message: data.error || "Sign out failed",
          status: response.status,
        };
        setError(err);
        return {
          success: false,
          error: err.message,
        };
      }

      // Success: call callback if provided
      if (onSuccess) {
        onSuccess();
      }

      return { success: true };
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred";
      const authError: AuthProxyError = { message };
      setError(authError);
      return {
        success: false,
        error: message,
      };
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return {
    signIn,
    signOut,
    isLoading,
    error,
    clearError,
  };
}
