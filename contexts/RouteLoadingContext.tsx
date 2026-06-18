"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type RouteLoadingContextValue = {
  isRouteLoading: boolean;
  startRouteLoading: () => void;
  stopRouteLoading: () => void;
};

const RouteLoadingContext = createContext<RouteLoadingContextValue | undefined>(undefined);

export function RouteLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const pathname = usePathname();

  const startRouteLoading = useCallback(() => setIsRouteLoading(true), []);
  const stopRouteLoading = useCallback(() => setIsRouteLoading(false), []);

  React.useEffect(() => {
    // When pathname changes, we consider navigation completed
    setIsRouteLoading(false);
  }, [pathname]);

  const value = useMemo(
    () => ({ isRouteLoading, startRouteLoading, stopRouteLoading }),
    [isRouteLoading, startRouteLoading, stopRouteLoading]
  );

  return (
    <RouteLoadingContext.Provider value={value}>{children}</RouteLoadingContext.Provider>
  );
}

export function useRouteLoading(): RouteLoadingContextValue {
  const ctx = useContext(RouteLoadingContext);
  if (!ctx) {
    throw new Error("useRouteLoading must be used within a RouteLoadingProvider");
  }
  return ctx;
}


