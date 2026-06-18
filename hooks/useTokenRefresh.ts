"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { refreshTokenAction } from "@/lib/auth";

interface UseTokenRefreshOptions {
  refreshInterval?: number;
  onTokenRefresh?: () => void;
  onTokenRefreshError?: (error: string) => void;
}

export function useTokenRefresh(options: UseTokenRefreshOptions = {}) {
  const {
    refreshInterval = 50 * 60 * 1000, // 50 minutes (refresh before 1 hour expiry)
    onTokenRefresh,
    onTokenRefreshError,
  } = options;

  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  const refreshToken = useCallback(async () => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    try {
      console.log("🔄 Attempting periodic token refresh...");
      const result = await refreshTokenAction();
      if (result.success) {
        console.log("✅ Periodic token refresh successful");
        onTokenRefresh?.();
      } else {
        console.log("❌ Periodic token refresh failed:", result.message);
        onTokenRefreshError?.(result.message || "Token refresh failed");
        router.push("/login");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error during token refresh";
      console.log("❌ Periodic token refresh error:", msg);
      onTokenRefreshError?.(msg);
      router.push("/login");
    } finally {
      isRefreshingRef.current = false;
    }
  }, [onTokenRefresh, onTokenRefreshError, router]);

  const startTokenRefresh = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    // Trigger an immediate refresh attempt when starting the loop
    refreshToken();
    intervalRef.current = setInterval(refreshToken, refreshInterval);
  }, [refreshInterval, refreshToken]);

  const stopTokenRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => () => stopTokenRefresh(), [stopTokenRefresh]);

  return { startTokenRefresh, stopTokenRefresh, refreshToken, isRefreshing: isRefreshingRef.current };
}


